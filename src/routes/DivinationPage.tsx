import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Share2 } from "lucide-react";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import Chip from "@/components/ui/Chip";
import Segmented from "@/components/ui/Segmented";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import SpreadLayout from "@/components/tarot/SpreadLayout";
import TarotCard from "@/components/tarot/TarotCard";
import CardFan from "@/components/tarot/CardFan";
import SpreadPicker from "@/components/SpreadPicker";
import ShareSheet from "@/components/ShareSheet";
import PageHeader from "@/layout/PageHeader";
import { useRitualContext } from "@/hooks/RitualContext";
import type { ChoiceSlot, ResultTab } from "@/hooks/useRitual";
import type { DrawnCard, ReadingResult } from "@/types";

const RESULT_TABS: Array<{ value: ResultTab; label: string }> = [
  { value: "meanings", label: "牌義" },
  { value: "analysis", label: "解析" },
];

// ── Sub-components ──────────────────────────────────────────

function MeaningsPanel({ drawnCards }: { drawnCards: DrawnCard[] }) {
  return (
    <div className="meanings-panel">
      {drawnCards.map((draw, i) => {
        const isUpright = draw.orientation === "upright";
        return (
          <article key={`${draw.position.id}-${i}`} className="meaning-card">
            <div>
              <TarotCard
                card={draw.card}
                orientation={draw.orientation}
                faceUp
                ariaLabel={`${draw.card.nameZh}（${isUpright ? "正位" : "逆位"}）`}
              />
            </div>
            <div className="meaning-card__copy">
              <p className="meaning-card__pos">
                {i + 1}. {draw.position.label}
              </p>
              <h3 className="meaning-card__name">
                {draw.card.nameZh}｜{draw.card.nameEn}
              </h3>
              <div className="meaning-card__meta">
                <span
                  className={`orientation-badge orientation-badge--${draw.orientation}`}
                >
                  {isUpright ? "正位" : "逆位"}
                </span>
                <span className="meaning-card__prompt">
                  {draw.position.prompt}
                </span>
              </div>
              <div className="meaning-card__sections">
                <section>
                  <h4>牌面意象</h4>
                  <p>{draw.card.visualDescription}</p>
                </section>
                <section>
                  <h4>牌語</h4>
                  <p>{draw.card.cardMessage}</p>
                </section>
                <section>
                  <h4>指引</h4>
                  <p>{draw.card.generalInterpretation}</p>
                </section>
                <section>
                  <h4>{isUpright ? "正" : "逆"}位焦點</h4>
                  <p>
                    {isUpright
                      ? draw.card.uprightMeaning
                      : draw.card.reversedMeaning}
                  </p>
                </section>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// Render the clarification text: lines starting with "# " become section headers.
function ClarificationBody({ text }: { text: string }) {
  const blocks: Array<{ heading: string; body: string }> = [];
  let current: { heading: string; body: string } | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) {
      if (current) blocks.push(current);
      current = { heading: line.slice(2).trim(), body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    } else if (line.trim()) {
      current = { heading: "", body: line };
    }
  }
  if (current) blocks.push(current);

  if (blocks.length === 0) return <p className="clarification-text">{text}</p>;

  return (
    <div className="clarification-body">
      {blocks.map((b, i) => (
        <div key={i} className="clarification-block">
          {b.heading && <h4 className="clarification-block__h">{b.heading}</h4>}
          <p className="clarification-block__p">{b.body.trim()}</p>
        </div>
      ))}
    </div>
  );
}

function AnalysisPanel({
  reading,
  clarification,
  isClarifying,
  clarificationError,
  onRetryClarification,
}: {
  reading: ReadingResult | null;
  clarification: string;
  isClarifying: boolean;
  clarificationError: string;
  onRetryClarification: () => void;
}) {
  return (
    <div className="analysis-panel">
      {reading && (
        <>
          <div className="analysis-summary">
            <p>{reading.summary}</p>
          </div>
          {reading.actions.length > 0 && (
            <div className="analysis-actions">
              <h3>行動指引</h3>
              <ol>
                {reading.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
      <div className="clarification-section">
        <h3>深層解析</h3>
        {isClarifying ? (
          <div className="clarification-loading">
            <SkeletonText lines={4} />
            <Skeleton height="14px" width="60%" />
            <p className="clarification-loading-hint">賢者正凝視牌面…</p>
          </div>
        ) : clarificationError ? (
          <div className="clarification-error-wrap">
            <p className="clarification-error">{clarificationError}</p>
            <Button variant="secondary" size="sm" onClick={onRetryClarification}>
              重新生成深層解析
            </Button>
          </div>
        ) : clarification ? (
          <ClarificationBody text={clarification} />
        ) : null}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function DivinationPage() {
  const [questionPromptOpen, setQuestionPromptOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const {
    phase,
    question,
    setQuestion,
    selectedSpreadId,
    selectedSpread,
    cardsToChoose,
    trimmedQuestion,
    hasTriedSubmit,
    choiceSlots,
    selectedIds,
    drawnCards,
    revealedCount,
    reading,
    usedFallback,
    fallbackMessage,
    isRegenerating,
    regenerateReading,
    regenerateClarification,
    clarification,
    isClarifying,
    clarificationError,
    activeResultTab,
    setActiveResultTab,
    currentHistoryItem,
    beginRitual,
    changeSpread,
    chooseCard,
    skipFocusing,
    skipRevealing,
    resetAll,
    resetToHome,
    restartWithQuestion,
    toggleFavorite,
  } = useRitualContext();

  // ── idle ─────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <>
        <PageHeader
          className="page-header--brand"
          title="燭見"
          action={
            <Link to="/daily" className="btn btn--ghost btn--sm">
              今日指引
            </Link>
          }
        />
        <div className="page-body">
          <p className="divination-slogan">探索內心，照見方向</p>
          <SpreadPicker selectedId={selectedSpreadId} onChange={changeSpread} />
          <div className="question-section">
            <label htmlFor="ritual-q" className="question-label">
              心中想知道
            </label>
            <textarea
              id="ritual-q"
              className="question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`例如：${selectedSpread.exampleQuestions[0]}`}
              rows={3}
            />
            <div className="example-chips">
              {selectedSpread.exampleQuestions.map((q) => (
                <Chip key={q} onClick={() => setQuestion(q)}>
                  {q}
                </Chip>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky-cta">
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => {
              if (!trimmedQuestion) {
                setQuestionPromptOpen(true);
                return;
              }
              beginRitual();
            }}
          >
            開始占卜
          </Button>
        </div>

        <BottomSheet
          open={questionPromptOpen}
          onClose={() => setQuestionPromptOpen(false)}
          title="先想一個問題"
        >
          <div className="question-prompt-sheet">
            <p className="question-prompt-sheet__desc">
              寫下一個你現在最想釐清的問題，再開始抽牌。
            </p>
            <div className="question-prompt-sheet__examples">
              {selectedSpread.exampleQuestions.map((q) => (
                <Chip
                  key={q}
                  onClick={() => {
                    setQuestion(q);
                    setQuestionPromptOpen(false);
                  }}
                >
                  {q}
                </Chip>
              ))}
            </div>
            <div className="question-prompt-sheet__actions">
              <Button
                variant="secondary"
                block
                onClick={() => setQuestionPromptOpen(false)}
              >
                自己輸入
              </Button>
            </div>
          </div>
        </BottomSheet>
      </>
    );
  }

  // ── focusing ─────────────────────────────────────────────
  if (phase === "focusing") {
    return (
      <div className="phase-focusing">
        <div className="focusing-flame" aria-hidden>
          <span className="focusing-flame__core" />
        </div>
        <p className="focusing-question">{trimmedQuestion}</p>
        <p className="focusing-hint">凝聚心神，讓問題沉澱…</p>
        <Button variant="ghost" onClick={skipFocusing}>
          跳過
        </Button>
      </div>
    );
  }

  // ── choosing ─────────────────────────────────────────────
  if (phase === "choosing") {
    const selectedSlots = selectedIds
      .map((id) => choiceSlots.find((slot) => slot.id === id))
      .filter((slot): slot is ChoiceSlot => Boolean(slot));
    const availableSlots = choiceSlots.filter(
      (slot) => !selectedIds.includes(slot.id)
    );

    return (
      <div className="phase-choosing">
        <div className="choosing-header">
          <div>
            <p className="choosing-kicker">抽取塔羅牌中</p>
            <p className="choosing-title">請抽 {cardsToChoose} 張</p>
          </div>
          <span
            className="choosing-progress"
            aria-label={`已選 ${selectedIds.length} 張，共需 ${cardsToChoose} 張`}
          >
            {selectedIds.length}/{cardsToChoose}
          </span>
        </div>

        <div className="draw-stage">
          <div className="draw-prompt">
            <p className="draw-prompt__title">憑直覺挑一張</p>
            <p className="draw-prompt__hint">
              從眼前這排牌裡選一張，選過的牌會收進下方。
            </p>
          </div>

          <div className="choosing-fan-wrap">
            <CardFan
              slots={availableSlots}
              selectedIds={selectedIds}
              onChoose={chooseCard}
            />
          </div>

          <div className="draw-selected" aria-label="已抽出的牌">
            <p className="choosing-title">已選牌</p>
            <div className="draw-selected__slots">
              {Array.from({ length: cardsToChoose }, (_, i) => {
                const slot = selectedSlots[i];
                return (
                  <div
                    key={slot?.id ?? `empty-${i}`}
                    className={`draw-selected__slot${slot ? " is-filled" : ""}`}
                    aria-label={
                      slot ? `第 ${i + 1} 張已抽出` : `第 ${i + 1} 張尚未抽出`
                    }
                  >
                    {slot ? <span aria-hidden>✦</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="choosing-footer">
          <Button variant="secondary" size="sm" onClick={resetToHome}>
            回首頁
          </Button>
          <Button variant="secondary" size="sm" onClick={resetAll}>
            修改問題
          </Button>
        </div>
      </div>
    );
  }

  // ── revealing ────────────────────────────────────────────
  if (phase === "revealing") {
    return (
      <>
        <PageHeader
          title="牌面展開"
          action={
            <Button variant="ghost" size="sm" onClick={skipRevealing}>
              跳過
            </Button>
          }
        />
        <div className="phase-revealing">
          <SpreadLayout
            spread={selectedSpread}
            drawnCards={drawnCards}
            revealedCount={revealedCount}
          />
        </div>
      </>
    );
  }

  // ── reading ──────────────────────────────────────────────
  if (phase === "reading") {
    return (
      <>
        <PageHeader title="正在解讀" />
        <div className="phase-reading">
          <SpreadLayout
            spread={selectedSpread}
            drawnCards={drawnCards}
            revealedCount={drawnCards.length}
          />
          <div className="reading-skeleton-wrap">
            <p className="reading-oracle">正在統整訊息…</p>
            <SkeletonText lines={5} />
            <div style={{ height: "var(--sp-3)" }} />
            <SkeletonText lines={3} />
          </div>
        </div>
      </>
    );
  }

  // ── done ─────────────────────────────────────────────────
  const isFavorite = currentHistoryItem?.isFavorite ?? false;

  return (
    <>
      <PageHeader
        className="page-header--brand"
        title="燭見"
        action={
          <Button variant="secondary" size="sm" onClick={resetToHome}>
            回首頁
          </Button>
        }
      />
      <div className="phase-done">
        <SpreadLayout
          spread={selectedSpread}
          drawnCards={drawnCards}
          revealedCount={drawnCards.length}
        />
        {usedFallback && (
          <div className="fallback-banner">
            {fallbackMessage && <p>{fallbackMessage}</p>}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => regenerateReading()}
              disabled={isRegenerating}
            >
              {isRegenerating ? "重新生成中…" : "重新生成 AI 解讀"}
            </Button>
          </div>
        )}
        <div className="result-tabs-wrap">
          <Segmented
            options={RESULT_TABS}
            value={activeResultTab}
            onChange={setActiveResultTab}
          />
        </div>
        <div className="result-panel">
          {activeResultTab === "meanings" ? (
            <MeaningsPanel drawnCards={drawnCards} />
          ) : (
            <AnalysisPanel
              reading={reading}
              clarification={clarification}
              isClarifying={isClarifying}
              clarificationError={clarificationError}
              onRetryClarification={() => regenerateClarification()}
            />
          )}
        </div>

        <div className="done-actions" role="toolbar" aria-label="結果操作">
          <button
            type="button"
            className="done-action-btn"
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={20} />
            分享
          </button>
          <button
            type="button"
            className={`done-action-btn${isFavorite ? " is-active" : ""}`}
            onClick={() => toggleFavorite()}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "取消收藏" : "加入收藏"}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            收藏
          </button>
        </div>
      </div>

      {reading && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          question={trimmedQuestion}
          spread={selectedSpread}
          reading={reading}
        />
      )}
    </>
  );
}
