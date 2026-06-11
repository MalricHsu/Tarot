import { Copy, Download, Flame, HelpCircle, RotateCcw } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import TarotTableScene from "./components/TarotTableScene";
import { cardBackImage, TAROT_DECK } from "./data/tarot";
import { generateClarification, generateReading } from "./logic/gemini";
import {
  buildClarificationFallback,
  buildInterpretation,
  defaultSpread,
  getSpreadById,
  spreads,
} from "./logic/spread";
import type {
  DrawnCard,
  Orientation,
  ReadingResult,
  SpreadDefinition,
  SpreadId,
  TarotCard,
} from "./types";

/* ── Real-time Clock ───────────────────────────────── */

function padZero(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const M = padZero(date.getMonth() + 1);
  const d = padZero(date.getDate());
  const h = padZero(date.getHours());
  const m = padZero(date.getMinutes());
  const s = padZero(date.getSeconds());
  return `${y}/${M}/${d}　${h}:${m}:${s}`;
}

function useClock(): string {
  const [now, setNow] = useState(() => formatDateTime(new Date()));

  const tick = useCallback(() => {
    setNow(formatDateTime(new Date()));
  }, []);

  useEffect(() => {
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  return now;
}

function Clock() {
  const time = useClock();
  return (
    <time className="live-clock" aria-label="目前時間">
      {time}
    </time>
  );
}

type RitualPhase =
  | "idle"
  | "focusing"
  | "choosing"
  | "revealing"
  | "reading"
  | "done";

interface ChoiceSlot {
  id: string;
  card: TarotCard;
  orientation: Orientation;
}

const FAN_SIZE = 15;

function createChoiceSlots(): ChoiceSlot[] {
  const pool = [...TAROT_DECK];

  return Array.from({ length: FAN_SIZE }, (_, index) => {
    const cardIndex = Math.floor(Math.random() * pool.length);
    const [card] = pool.splice(cardIndex, 1);
    const orientation: Orientation =
      Math.random() >= 0.5 ? "upright" : "reversed";

    return {
      id: `${card.id}-${index}`,
      card,
      orientation,
    };
  });
}

function selectedSlotsToDrawnCards(
  selectedSlots: ChoiceSlot[],
  spread: SpreadDefinition,
): DrawnCard[] {
  return selectedSlots.map((slot, index) => ({
    card: slot.card,
    orientation: slot.orientation,
    position: spread.positions[index],
  }));
}

function buildShareText(
  question: string,
  spread: SpreadDefinition,
  reading: ReadingResult,
): string {
  const cards = reading.cards
    .map((draw, index) => {
      const direction = draw.orientation === "upright" ? "正位" : "逆位";
      return `${index + 1}. ${draw.position.label}：${draw.card.nameZh}（${direction}）`;
    })
    .join("\n");

  return `燭見塔羅解讀
問題：${question}
牌陣：${spread.label}

牌面：
${cards}

總結：
${reading.summary}`;
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const char of paragraph) {
      const next = `${line}${char}`;
      if (context.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }

  return lines;
}

function App() {
  const [selectedSpreadId, setSelectedSpreadId] = useState<SpreadId>(
    defaultSpread.id,
  );
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<RitualPhase>("idle");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [choiceSlots, setChoiceSlots] = useState<ChoiceSlot[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [clarification, setClarification] = useState("");
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarificationError, setClarificationError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const readingStartedRef = useRef(false);

  const selectedSpread = getSpreadById(selectedSpreadId);
  const cardsToChoose = selectedSpread.positions.length;
  const trimmedQuestion = question.trim();
  const canBegin = trimmedQuestion.length > 0 && phase === "idle";
  const showError = hasTriedSubmit && trimmedQuestion.length === 0;

  useEffect(() => {
    if (phase !== "focusing") return;

    const timer = window.setTimeout(() => {
      setChoiceSlots(createChoiceSlots());
      setSelectedIds([]);
      setDrawnCards([]);
      setRevealedCount(0);
      setReading(null);
      setUsedFallback(false);
      setClarification("");
      setIsClarifying(false);
      setClarificationError("");
      setShareStatus("");
      readingStartedRef.current = false;
      setPhase("choosing");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing") return;

    const timers = Array.from({ length: drawnCards.length }, (_, index) =>
      window.setTimeout(() => setRevealedCount(index + 1), 360 + index * 520),
    );
    const readingTimer = window.setTimeout(
      () => setPhase("reading"),
      720 + drawnCards.length * 520,
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(readingTimer);
    };
  }, [drawnCards.length, phase]);

  useEffect(() => {
    if (
      phase !== "reading" ||
      readingStartedRef.current ||
      drawnCards.length !== cardsToChoose
    )
      return;

    readingStartedRef.current = true;

    async function readCards() {
      try {
        const geminiResult = await generateReading(
          trimmedQuestion,
          drawnCards,
          selectedSpread,
        );
        setReading({ cards: drawnCards, ...geminiResult });
        setUsedFallback(false);
      } catch (error) {
        console.error(error);
        setReading(
          buildInterpretation(trimmedQuestion, drawnCards, selectedSpread),
        );
        setUsedFallback(true);
      } finally {
        setPhase("done");
      }
    }

    readCards();
  }, [cardsToChoose, drawnCards, phase, selectedSpread, trimmedQuestion]);

  useEffect(() => {
    if (phase === "reading" || phase === "done") {
      const el = document.getElementById("reading-results");
      window.setTimeout(
        () => el?.scrollIntoView({ behavior: "smooth", block: "start" }),
        250,
      );
    }
  }, [phase]);

  const beginRitual = (event?: FormEvent) => {
    event?.preventDefault();
    setHasTriedSubmit(true);
    if (trimmedQuestion.length === 0 || phase !== "idle") return;

    setPhase("focusing");
  };

  const changeSpread = (spreadId: SpreadId) => {
    if (phase !== "idle") return;
    setSelectedSpreadId(spreadId);
    setHasTriedSubmit(false);
  };

  const chooseCard = (slotId: string) => {
    if (
      phase !== "choosing" ||
      selectedIds.includes(slotId) ||
      selectedIds.length >= cardsToChoose
    )
      return;

    const nextSelectedIds = [...selectedIds, slotId];
    setSelectedIds(nextSelectedIds);

    if (nextSelectedIds.length === cardsToChoose) {
      const selected = nextSelectedIds
        .map((id) => choiceSlots.find((slot) => slot.id === id))
        .filter((slot): slot is ChoiceSlot => Boolean(slot));

      setDrawnCards(selectedSlotsToDrawnCards(selected, selectedSpread));
      window.setTimeout(() => setPhase("revealing"), 520);
    }
  };

  const resetAll = () => {
    setPhase("idle");
    setHasTriedSubmit(false);
    setChoiceSlots([]);
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedCount(0);
    setReading(null);
    setUsedFallback(false);
    setClarification("");
    setIsClarifying(false);
    setClarificationError("");
    setShareStatus("");
    readingStartedRef.current = false;
  };

  const restartWithQuestion = () => {
    if (trimmedQuestion.length === 0) {
      resetAll();
      return;
    }

    setChoiceSlots([]);
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedCount(0);
    setReading(null);
    setUsedFallback(false);
    setClarification("");
    setIsClarifying(false);
    setClarificationError("");
    setShareStatus("");
    readingStartedRef.current = false;
    setPhase("focusing");
  };

  const requestClarification = async () => {
    if (!reading || isClarifying) return;

    setIsClarifying(true);
    setClarificationError("");

    try {
      const result = await generateClarification(
        trimmedQuestion,
        reading.cards,
        selectedSpread,
        {
          interpretations: reading.interpretations,
          summary: reading.summary,
        },
      );
      setClarification(result);
    } catch (error) {
      console.error(error);
      setClarification(
        buildClarificationFallback(
          trimmedQuestion,
          reading.cards,
          selectedSpread,
          {
            interpretations: reading.interpretations,
            summary: reading.summary,
          },
        ),
      );
      setClarificationError("目前 GEMINI 連不上，已先幫你依上述牌面做統整。");
    } finally {
      setIsClarifying(false);
    }
  };

  const copyShareText = async () => {
    if (!reading) return;

    const text = buildShareText(trimmedQuestion, selectedSpread, reading);
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus("已複製解讀文字。");
    } catch (error) {
      console.error(error);
      setShareStatus("目前無法複製，請稍後再試。");
    }
  };

  const downloadShareImage = () => {
    if (!reading) return;

    const canvas = document.createElement("canvas");
    const scale = window.devicePixelRatio || 1;
    const width = 1080;
    const padding = 72;
    const contentWidth = width - padding * 2;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.font = '32px "Noto Sans TC", sans-serif';
    const textLines = wrapCanvasText(
      context,
      buildShareText(trimmedQuestion, selectedSpread, reading),
      contentWidth,
    );
    const height = Math.max(1080, 190 + textLines.length * 46 + padding);

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(scale, scale);

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#170b05");
    gradient.addColorStop(0.48, "#3a2115");
    gradient.addColorStop(1, "#080403");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(
      width * 0.18,
      100,
      20,
      width * 0.18,
      100,
      380,
    );
    glow.addColorStop(0, "rgba(255, 181, 84, 0.42)");
    glow.addColorStop(0.42, "rgba(255, 134, 48, 0.14)");
    glow.addColorStop(1, "rgba(255, 134, 48, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(255, 210, 138, 0.42)";
    context.lineWidth = 2;
    context.strokeRect(36, 36, width - 72, height - 72);

    context.fillStyle = "#ffd38a";
    context.font = '700 34px "Noto Serif TC", serif';
    context.fillText("燭見", padding, 118);

    context.fillStyle = "#ebe2d0";
    context.font = '32px "Noto Sans TC", sans-serif';
    let y = 190;
    for (const line of textLines) {
      context.fillText(line, padding, y);
      y += line ? 46 : 26;
    }

    const link = document.createElement("a");
    link.download = "tarot-reading.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    setShareStatus("已下載分享圖。");
  };

  return (
    <>
      <main className="app-shell">
        <section className="ritual-stage" aria-labelledby="app-title">
          <section
            className={`hero-table phase-${phase}`}
            aria-label="燭光塔羅桌"
          >
            <div className="ritual-panel">
              <header className="app-header">
                <div className="header-icon">
                  <Flame size={28} strokeWidth={1.6} />
                </div>
                <Clock />
                <p className="eyebrow">燭光塔羅</p>
                <h1 id="app-title">燭見</h1>
              </header>

              <section className="question-orb" aria-label="輸入問題">
                <form className="question-form" onSubmit={beginRitual}>
                  <fieldset
                    className="spread-picker"
                    disabled={phase !== "idle"}
                  >
                    <legend>選擇牌陣</legend>
                    <div className="spread-options">
                      {spreads.map((spread) => (
                        <label
                          className={`spread-option${selectedSpreadId === spread.id ? " is-active" : ""}`}
                          key={spread.id}
                        >
                          <input
                            type="radio"
                            name="spread"
                            value={spread.id}
                            checked={selectedSpreadId === spread.id}
                            onChange={() => changeSpread(spread.id)}
                          />
                          <span>{spread.label}</span>
                          <small>{spread.description}</small>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label htmlFor="question">將問題放在心中</label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={`例如：${selectedSpread.exampleQuestions[0]}`}
                    rows={3}
                    disabled={phase !== "idle"}
                  />
                  {phase === "idle" ? (
                    <div className="example-questions" aria-label="問題範例">
                      {selectedSpread.exampleQuestions.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setQuestion(example)}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {showError ? (
                    <p className="field-error">請先輸入一個想反思的問題。</p>
                  ) : null}

                  {phase === "idle" ? (
                    <button
                      className="primary-action"
                      type="submit"
                      disabled={!canBegin}
                    >
                      <Flame size={16} />
                      抽取命運之牌
                    </button>
                  ) : (
                    <div className="action-row">
                      <button
                        className="secondary-action"
                        type="button"
                        onClick={resetAll}
                      >
                        修改問題
                      </button>
                      <button
                        className="primary-action compact"
                        type="button"
                        onClick={restartWithQuestion}
                        disabled={
                          phase === "focusing" ||
                          phase === "revealing" ||
                          phase === "reading"
                        }
                      >
                        <RotateCcw size={15} />
                        重新聆聽命運
                      </button>
                    </div>
                  )}
                </form>
              </section>
            </div>

            <TarotTableScene
              phase={phase}
              choiceSlots={choiceSlots}
              selectedIds={selectedIds}
              drawnCards={drawnCards}
              revealedCount={revealedCount}
              selectedSpread={selectedSpread}
              cardBackImage={cardBackImage}
              onChooseCard={chooseCard}
            />
          </section>

          <section className="deck-area" aria-label="塔羅牌區">
            {drawnCards.length === cardsToChoose &&
            ["revealing", "reading", "done"].includes(phase) ? (
              <div id="reading-results">
                <div className="section-divider">
                  <span>
                    {phase === "revealing"
                      ? "牌面展開"
                      : `${selectedSpread.label}解讀結果`}
                  </span>
                </div>

                <div className="reading-grid">
                  {drawnCards.map((draw, index) => {
                    const isRevealed = revealedCount > index;

                    return (
                      <article
                        className={`reading-card${isRevealed ? " is-revealed" : ""}`}
                        key={`${draw.position.id}-${draw.card.id}`}
                      >
                        <div className="flip-card" aria-hidden={!isRevealed}>
                          <div className="flip-card-inner">
                            <div className="flip-face flip-back">
                              <img src={cardBackImage} alt="" />
                            </div>
                            <div className="flip-face flip-front">
                              <img
                                className={
                                  draw.orientation === "reversed"
                                    ? "card-visual reversed"
                                    : "card-visual"
                                }
                                src={draw.card.image}
                                alt={`${draw.card.nameZh} ${draw.orientation === "upright" ? "正位" : "逆位"}`}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="card-copy">
                          <p className="position-label">
                            {index + 1}. {draw.position.label}
                          </p>
                          <h2>{isRevealed ? draw.card.nameZh : "等待翻牌"}</h2>
                          {isRevealed ? (
                            <span
                              className={`orientation-badge ${
                                draw.orientation === "reversed"
                                  ? "reversed"
                                  : "upright"
                              }`}
                            >
                              {draw.orientation === "upright" ? "正位" : "逆位"}
                            </span>
                          ) : null}
                          {phase === "reading" ? (
                            <p className="loading-text">正在解讀牌面⋯⋯</p>
                          ) : null}
                          {phase === "done" ? (
                            <p className="card-interpretation">
                              {reading?.interpretations[index]}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          {phase === "reading" ? (
            <aside
              className="summary loading"
              aria-label="總結建議"
              aria-live="polite"
            >
              <h2>正在解讀牌面</h2>
              <p>牌意正在匯整，請稍候片刻。</p>
            </aside>
          ) : null}

          {phase === "done" && usedFallback ? (
            <aside className="summary note" aria-label="解讀提示">
              <h2>解讀提示</h2>
              <p>解讀已完成，請依你的情境作為反思參考。</p>
            </aside>
          ) : null}

          {phase === "done" && reading ? (
            <aside className="summary" aria-label="總結建議">
              <h2>總結建議</h2>
              <p>{reading.summary}</p>
              <div className="result-actions" aria-label="結果操作">
                <button
                  className="secondary-action icon-action"
                  type="button"
                  onClick={copyShareText}
                >
                  <Copy size={16} />
                  複製文字
                </button>
                <button
                  className="secondary-action icon-action"
                  type="button"
                  onClick={downloadShareImage}
                >
                  <Download size={16} />
                  下載分享圖
                </button>
              </div>
              {shareStatus ? (
                <p className="status-text" role="status">
                  {shareStatus}
                </p>
              ) : null}
              <div className="clarification-panel">
                <button
                  className="primary-action"
                  type="button"
                  onClick={requestClarification}
                  disabled={isClarifying}
                >
                  <HelpCircle size={16} />
                  {isClarifying ? "賢者解析中" : "賢者解析"}
                </button>
                {isClarifying ? (
                  <p className="loading-text">賢者解析中⋯⋯</p>
                ) : null}
                {clarificationError ? (
                  <p className="field-error">{clarificationError}</p>
                ) : null}
                {clarification ? (
                  <div className="clarification-copy" aria-label="解惑補充">
                    <h2>解惑補充</h2>
                    <p>{clarification}</p>
                  </div>
                ) : null}
              </div>
            </aside>
          ) : null}
        </section>
      </main>
    </>
  );
}

export default App;
