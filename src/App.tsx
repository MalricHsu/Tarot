import {
  BookOpen,
  CalendarDays,
  Copy,
  Download,
  Flame,
  Heart,
  History,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
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
import {
  clearReadingHistory,
  createReadingHistoryItem,
  deleteReadingHistoryItem,
  getDailyCardRecord,
  loadReadingHistory,
  updateDailyCardRecord,
  updateReadingHistoryItem,
  upsertReadingHistoryItem,
} from "./logic/storage";
import type {
  DrawnCard,
  Orientation,
  ReadingHistoryItem,
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
type ResultTab = "meanings" | "analysis";
type AppView = "ritual" | "history";

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
${reading.summary}

接下來可以做的事：
${reading.actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}`;
}

function getOrientationLabel(orientation: Orientation): string {
  return orientation === "upright" ? "正位" : "逆位";
}

function getOrientationMeaning(draw: DrawnCard): string {
  return draw.orientation === "upright"
    ? draw.card.uprightMeaning
    : draw.card.reversedMeaning;
}

function getGeminiFallbackMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (import.meta.env.DEV && message.includes("404")) {
    return "";
  }

  if (message.includes("Gemini API key is not configured")) {
    return "目前 Vercel Function 有回應，但沒有讀到 GEMINI_API_KEY；請到 Vercel Environment Variables 設定後重新部署。";
  }

  if (message.includes("502")) {
    return "目前 Vercel Function 已呼叫 Gemini，但 Gemini 回覆失敗、key 無效或配額/權限有問題；已先用本地牌義完成統整。";
  }

  return "目前 Gemini API 沒有成功回覆；已先用本地牌義完成統整。";
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
  const [view, setView] = useState<AppView>("ritual");
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
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [clarification, setClarification] = useState("");
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarificationError, setClarificationError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [activeResultTab, setActiveResultTab] =
    useState<ResultTab>("meanings");
  const [historyItems, setHistoryItems] = useState<ReadingHistoryItem[]>(() =>
    loadReadingHistory(),
  );
  const [currentHistoryItemId, setCurrentHistoryItemId] = useState("");
  const readingStartedRef = useRef(false);
  const clarificationStartedRef = useRef(false);
  const clarificationRequestRef = useRef(0);

  const selectedSpread = getSpreadById(selectedSpreadId);
  const cardsToChoose = selectedSpread.positions.length;
  const spreadSummary = `本次會抽 ${cardsToChoose} 張牌：${selectedSpread.positions
    .map((position, index) => `第 ${index + 1} 張看${position.label}`)
    .join("，")}。`;
  const trimmedQuestion = question.trim();
  const canBegin = trimmedQuestion.length > 0 && phase === "idle";
  const showError = hasTriedSubmit && trimmedQuestion.length === 0;
  const currentHistoryItem = currentHistoryItemId
    ? historyItems.find((item) => item.id === currentHistoryItemId)
    : null;

  const persistHistoryItem = useCallback((item: ReadingHistoryItem) => {
    const next = upsertReadingHistoryItem(item);
    setHistoryItems(next);
    setCurrentHistoryItemId(item.id);
    if (item.source === "daily") {
      updateDailyCardRecord(item);
    }
  }, []);

  useEffect(() => {
    if (phase !== "focusing") return;

    const timer = window.setTimeout(() => {
      setChoiceSlots(createChoiceSlots());
      setSelectedIds([]);
      setDrawnCards([]);
      setRevealedCount(0);
      setReading(null);
      setUsedFallback(false);
      setFallbackMessage("");
      setClarification("");
      setIsClarifying(false);
      setClarificationError("");
      setShareStatus("");
      setActiveResultTab("meanings");
      setCurrentHistoryItemId("");
      readingStartedRef.current = false;
      clarificationStartedRef.current = false;
      clarificationRequestRef.current += 1;
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
        const nextReading = { cards: drawnCards, ...geminiResult };
        setReading(nextReading);
        persistHistoryItem(
          createReadingHistoryItem({
            question: trimmedQuestion,
            spreadId: selectedSpread.id,
            spreadLabel: selectedSpread.label,
            reading: nextReading,
          }),
        );
        setUsedFallback(false);
        setFallbackMessage("");
      } catch (error) {
        console.error(error);
        const nextReading = buildInterpretation(trimmedQuestion, drawnCards, selectedSpread);
        setReading(nextReading);
        persistHistoryItem(
          createReadingHistoryItem({
            question: trimmedQuestion,
            spreadId: selectedSpread.id,
            spreadLabel: selectedSpread.label,
            reading: nextReading,
          }),
        );
        setUsedFallback(true);
        setFallbackMessage(getGeminiFallbackMessage(error));
      } finally {
        setPhase("done");
      }
    }

    readCards();
  }, [cardsToChoose, drawnCards, persistHistoryItem, phase, selectedSpread, trimmedQuestion]);

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
      setClarification("");
      setIsClarifying(false);
      setClarificationError("");
      setActiveResultTab("meanings");
      clarificationStartedRef.current = false;
      clarificationRequestRef.current += 1;
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
    setFallbackMessage("");
    setClarification("");
    setIsClarifying(false);
    setClarificationError("");
    setShareStatus("");
    setActiveResultTab("meanings");
    setCurrentHistoryItemId("");
    readingStartedRef.current = false;
    clarificationStartedRef.current = false;
    clarificationRequestRef.current += 1;
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
    setFallbackMessage("");
    setClarification("");
    setIsClarifying(false);
    setClarificationError("");
    setShareStatus("");
    setActiveResultTab("meanings");
    setCurrentHistoryItemId("");
    readingStartedRef.current = false;
    clarificationStartedRef.current = false;
    clarificationRequestRef.current += 1;
    setPhase("focusing");
  };

  const requestClarification = useCallback(async () => {
    if (!reading || isClarifying) return;

    const requestId = ++clarificationRequestRef.current;
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
          actions: reading.actions,
        },
      );
      if (clarificationRequestRef.current !== requestId) return;
      setClarification(result);
      if (currentHistoryItemId) {
        setHistoryItems(
          updateReadingHistoryItem(currentHistoryItemId, (item) => ({
            ...item,
            clarification: result,
          })),
        );
      }
    } catch (error) {
      console.error(error);
      if (clarificationRequestRef.current !== requestId) return;
      const fallback = buildClarificationFallback(
          trimmedQuestion,
          reading.cards,
          selectedSpread,
          {
            interpretations: reading.interpretations,
            summary: reading.summary,
            actions: reading.actions,
          },
        );
      setClarification(fallback);
      if (currentHistoryItemId) {
        setHistoryItems(
          updateReadingHistoryItem(currentHistoryItemId, (item) => ({
            ...item,
            clarification: fallback,
          })),
        );
      }
      setClarificationError(getGeminiFallbackMessage(error));
    } finally {
      if (clarificationRequestRef.current === requestId) {
        setIsClarifying(false);
      }
    }
  }, [currentHistoryItemId, isClarifying, reading, selectedSpread, trimmedQuestion]);

  useEffect(() => {
    if (phase !== "done" || !reading || clarificationStartedRef.current) return;

    clarificationStartedRef.current = true;
    void requestClarification();
  }, [phase, reading, requestClarification]);

  const openHistoryItem = (item: ReadingHistoryItem) => {
    const spread = getSpreadById(item.spreadId);
    setView("ritual");
    setSelectedSpreadId(spread.id);
    setQuestion(item.question);
    setPhase("done");
    setHasTriedSubmit(false);
    setChoiceSlots([]);
    setSelectedIds([]);
    setDrawnCards(item.reading.cards);
    setRevealedCount(item.reading.cards.length);
    setReading(item.reading);
    setUsedFallback(false);
    setFallbackMessage("");
    setClarification(item.clarification);
    setIsClarifying(false);
    setClarificationError("");
    setShareStatus("");
    setActiveResultTab("analysis");
    setCurrentHistoryItemId(item.id);
    readingStartedRef.current = true;
    clarificationStartedRef.current = true;
    clarificationRequestRef.current += 1;
  };

  const openDailyCard = () => {
    const { historyItem } = getDailyCardRecord();
    const latestHistory = loadReadingHistory();
    setHistoryItems(latestHistory);
    openHistoryItem(historyItem);
  };

  const toggleFavorite = (itemId = currentHistoryItemId) => {
    if (!itemId) return;

    const next = updateReadingHistoryItem(itemId, (item) => {
      const updated = { ...item, isFavorite: !item.isFavorite };
      if (updated.source === "daily") {
        updateDailyCardRecord(updated);
      }
      return updated;
    });
    setHistoryItems(next);
  };

  const deleteHistoryEntry = (itemId: string) => {
    const next = deleteReadingHistoryItem(itemId);
    setHistoryItems(next);
    if (itemId === currentHistoryItemId) {
      resetAll();
    }
  };

  const clearHistoryEntries = () => {
    setHistoryItems(clearReadingHistory());
    setCurrentHistoryItemId("");
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
    gradient.addColorStop(0, "#fff5df");
    gradient.addColorStop(0.52, "#efd19b");
    gradient.addColorStop(1, "#d7ad6b");
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
    glow.addColorStop(0, "rgba(255, 255, 255, 0.62)");
    glow.addColorStop(0.46, "rgba(255, 244, 216, 0.28)");
    glow.addColorStop(1, "rgba(255, 244, 216, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(93, 49, 21, 0.46)";
    context.lineWidth = 2;
    context.strokeRect(36, 36, width - 72, height - 72);

    context.fillStyle = "#5a2e16";
    context.font = '700 34px "Noto Serif TC", serif';
    context.fillText("燭見", padding, 118);

    context.fillStyle = "#2f1b10";
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

  const resultTabs: {
    id: ResultTab;
    label: string;
    icon: typeof Sparkles;
  }[] = [
    { id: "meanings", label: "牌義", icon: BookOpen },
    { id: "analysis", label: "解析", icon: Sparkles },
  ];
  const choiceDialogTitle = `從桌面牌堆中選擇 ${cardsToChoose} 張牌`;

  const renderMeaningsPanel = () => (
    <section className="result-panel meanings-panel" aria-label="逐張牌義">
      <div className="reading-grid">
        {drawnCards.map((draw, index) => {
          const isRevealed = revealedCount > index;
          const orientationLabel = getOrientationLabel(draw.orientation);

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
                <h2>
                  {isRevealed
                    ? `${draw.card.nameZh}｜${draw.card.nameEn}`
                    : "等待翻牌"}
                </h2>
                {isRevealed ? (
                  <>
                    <div className="card-meta-row">
                      <span
                        className={`orientation-badge ${
                          draw.orientation === "reversed"
                            ? "reversed"
                            : "upright"
                        }`}
                      >
                        {orientationLabel}
                      </span>
                      <span>{draw.position.prompt}</span>
                    </div>
                    <div className="card-meaning-blocks">
                      <section>
                        <h3>牌面長相</h3>
                        <p>{draw.card.visualDescription}</p>
                      </section>
                      <section>
                        <h3>這張牌在說什麼</h3>
                        <p>{draw.card.cardMessage}</p>
                      </section>
                      <section>
                        <h3>一般解讀</h3>
                        <p>{draw.card.generalInterpretation}</p>
                      </section>
                      <section>
                        <h3>{orientationLabel}焦點</h3>
                        <p>{getOrientationMeaning(draw)}</p>
                      </section>
                    </div>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  const renderAnalysisPanel = () => (
    <section className="result-panel analysis-panel" aria-label="解析">
      {phase === "reading" ? (
        <aside
          className="summary loading"
          aria-label="總結建議"
          aria-live="polite"
        >
          <h2>正在統整這組牌給你的訊息</h2>
          <p>上方牌義已可先閱讀，正在把你的問題、牌陣位置與全部牌面串成整體回答。</p>
        </aside>
      ) : null}

      {phase === "done" && usedFallback && fallbackMessage ? (
        <aside className="summary note" aria-label="解讀提示">
          <h2>解讀提示</h2>
          <p>{fallbackMessage}</p>
        </aside>
      ) : null}

      {phase === "done" && reading ? (
        <aside className="summary" aria-label="總結建議">
          <div className="summary-heading">
            <h2>根據你的問題</h2>
            {currentHistoryItemId ? (
              <button
                className={`favorite-button${currentHistoryItem?.isFavorite ? " is-active" : ""}`}
                type="button"
                onClick={() => toggleFavorite()}
                aria-pressed={Boolean(currentHistoryItem?.isFavorite)}
              >
                <Heart size={16} fill={currentHistoryItem?.isFavorite ? "currentColor" : "none"} />
                收藏
              </button>
            ) : null}
          </div>
          <p>{reading.summary}</p>
          <section className="action-list" aria-label="接下來可以做的事">
            <h3>接下來可以做的事</h3>
            <ol>
              {reading.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </section>
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
            {isClarifying ? (
              <p className="loading-text" role="status">
                賢者解析中...
              </p>
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
  );

  const renderHistoryView = () => (
    <main className="app-shell history-shell">
      <section className="history-page" aria-labelledby="history-title">
        <header className="history-header">
          <div>
            <p className="eyebrow">燭光塔羅</p>
            <h1 id="history-title">紀錄</h1>
          </div>
          <button className="secondary-action compact-button" type="button" onClick={() => setView("ritual")}>
            返回抽牌
          </button>
        </header>

        <div className="history-toolbar">
          <p>{historyItems.length ? `已保存 ${historyItems.length} 筆解讀` : "尚未保存任何解讀"}</p>
          <button className="secondary-action compact-button" type="button" onClick={clearHistoryEntries} disabled={!historyItems.length}>
            <Trash2 size={15} />
            清空全部
          </button>
        </div>

        <div className="history-list">
          {historyItems.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-card-main">
                <div className="history-card-title">
                  <span>{item.source === "daily" ? "今日指引" : item.spreadLabel}</span>
                  {item.isFavorite ? <Heart size={15} fill="currentColor" /> : null}
                </div>
                <h2>{item.question}</h2>
                <p>{new Date(item.createdAt).toLocaleString("zh-TW", { hour12: false })}</p>
                <div className="draw-overview">
                  {item.reading.cards.map((draw) => (
                    <span key={`${item.id}-${draw.position.id}-${draw.card.id}`}>
                      {draw.position.label}：{draw.card.nameZh}（{getOrientationLabel(draw.orientation)}）
                    </span>
                  ))}
                </div>
              </div>
              <div className="history-card-actions">
                <button className="secondary-action compact-button" type="button" onClick={() => openHistoryItem(item)}>
                  開啟
                </button>
                <button
                  className={`secondary-action compact-button${item.isFavorite ? " is-favorite" : ""}`}
                  type="button"
                  onClick={() => toggleFavorite(item.id)}
                  aria-pressed={item.isFavorite}
                >
                  <Heart size={15} fill={item.isFavorite ? "currentColor" : "none"} />
                  收藏
                </button>
                <button className="secondary-action compact-button danger-action" type="button" onClick={() => deleteHistoryEntry(item.id)}>
                  <Trash2 size={15} />
                  刪除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );

  return (
    <>
      {view === "history" ? renderHistoryView() : (
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
                <div className="top-actions" aria-label="快速入口">
                  <button className="secondary-action compact-button" type="button" onClick={openDailyCard}>
                    <CalendarDays size={15} />
                    今日指引
                  </button>
                  <button className="secondary-action compact-button" type="button" onClick={() => setView("history")}>
                    <History size={15} />
                    紀錄
                  </button>
                </div>
              </header>

              <section className="question-orb" aria-label="輸入問題">
                <form className="question-form" onSubmit={beginRitual}>
                  <div className="spread-picker">
                    <div className="spread-summary" aria-label="本次抽牌說明">
                      <span>本次抽牌說明</span>
                      <p>{spreadSummary}</p>
                    </div>
                    <label htmlFor="spread-select">選擇牌陣</label>
                    <div className="spread-select-row">
                      <select
                        id="spread-select"
                        value={selectedSpreadId}
                        onChange={(event) => changeSpread(event.target.value as SpreadId)}
                        disabled={phase !== "idle"}
                      >
                        {spreads.map((spread) => (
                          <option key={spread.id} value={spread.id}>
                            {spread.label}
                          </option>
                        ))}
                      </select>
                      <span aria-label="牌數">{cardsToChoose} 張</span>
                    </div>
                    <p className="spread-description">{selectedSpread.description}</p>
                  </div>

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
              phase={phase === "choosing" ? "focusing" : phase}
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
              <div id="reading-results" className="result-shell">
                <div className="section-divider">
                  <span>
                    {phase === "revealing"
                      ? "牌面展開"
                      : `${selectedSpread.label}解讀結果`}
                  </span>
                </div>

                <div className="result-tabs" role="tablist" aria-label="解讀分頁">
                  {resultTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeResultTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        className={`result-tab${isActive ? " is-active" : ""}`}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`result-panel-${tab.id}`}
                        id={`result-tab-${tab.id}`}
                        onClick={() => setActiveResultTab(tab.id)}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  id={`result-panel-${activeResultTab}`}
                  className="result-tab-panel"
                  role="tabpanel"
                  aria-labelledby={`result-tab-${activeResultTab}`}
                >
                  {activeResultTab === "analysis" ? renderAnalysisPanel() : null}
                  {activeResultTab === "meanings" ? renderMeaningsPanel() : null}
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </main>
      {phase === "choosing" ? (
        <div className="choice-dialog-backdrop">
          <section
            className="choice-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="choice-dialog-title"
          >
            <header className="choice-dialog-header">
              <div>
                <p className="choice-dialog-kicker">選牌中</p>
                <h2 id="choice-dialog-title">{choiceDialogTitle}</h2>
              </div>
              <span className="choice-dialog-progress" aria-label="選牌進度">
                {selectedIds.length}/{cardsToChoose}
              </span>
            </header>
            <TarotTableScene
              phase={phase}
              choiceSlots={choiceSlots}
              selectedIds={selectedIds}
              drawnCards={drawnCards}
              revealedCount={revealedCount}
              selectedSpread={selectedSpread}
              cardBackImage={cardBackImage}
              onChooseCard={chooseCard}
              variant="choiceOnly"
            />
            <div className="choice-dialog-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={resetAll}
              >
                修改問題
              </button>
            </div>
          </section>
        </div>
      ) : null}
      </>
      )}
    </>
  );
}

export default App;
