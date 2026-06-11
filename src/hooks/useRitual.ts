import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { TAROT_DECK } from '@/data/tarot';
import { generateClarification, generateReading } from '@/logic/gemini';
import {
  buildClarificationFallback,
  buildInterpretation,
  defaultSpread,
  getSpreadById,
} from '@/logic/spread';
import {
  clearReadingHistory,
  createReadingHistoryItem,
  deleteReadingHistoryItem,
  loadReadingHistory,
  updateDailyCardRecord,
  updateReadingHistoryItem,
  upsertReadingHistoryItem,
} from '@/logic/storage';
import type {
  DrawnCard,
  Orientation,
  ReadingHistoryItem,
  ReadingResult,
  SpreadDefinition,
  SpreadId,
  TarotCard,
} from '@/types';

export type RitualPhase = 'idle' | 'focusing' | 'choosing' | 'revealing' | 'reading' | 'done';
export type ResultTab = 'meanings' | 'analysis';

export interface ChoiceSlot {
  id: string;
  card: TarotCard;
  orientation: Orientation;
}

export const FAN_SIZE = 15;

function createChoiceSlots(): ChoiceSlot[] {
  const pool = [...TAROT_DECK];
  return Array.from({ length: FAN_SIZE }, (_, index) => {
    const cardIndex = Math.floor(Math.random() * pool.length);
    const [card] = pool.splice(cardIndex, 1);
    return {
      id: `${card.id}-${index}`,
      card,
      orientation: (Math.random() >= 0.5 ? 'upright' : 'reversed') as Orientation,
    };
  });
}

function selectedSlotsToDrawnCards(slots: ChoiceSlot[], spread: SpreadDefinition): DrawnCard[] {
  return slots.map((slot, i) => ({
    card: slot.card,
    orientation: slot.orientation,
    position: spread.positions[i],
  }));
}

export function getGeminiFallbackMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (import.meta.env.DEV && msg.includes('404')) return '';
  if (msg.includes('Gemini API key is not configured'))
    return '目前 Vercel Function 有回應，但沒有讀到 GEMINI_API_KEY；請到 Vercel Environment Variables 設定後重新部署。';
  if (msg.includes('504') || msg.includes('timeout'))
    return 'Gemini 回覆超時（Function 執行超過限制）；已先用本地牌義完成統整。';
  if (msg.includes('502'))
    return '目前 Vercel Function 已呼叫 Gemini，但 Gemini 回覆失敗、key 無效或配額/權限有問題；已先用本地牌義完成統整。';
  return `目前 Gemini API 沒有成功回覆（${msg}）；已先用本地牌義完成統整。`;
}

export function buildShareText(
  question: string,
  spread: SpreadDefinition,
  reading: ReadingResult,
): string {
  const cards = reading.cards
    .map((draw, i) => {
      const dir = draw.orientation === 'upright' ? '正位' : '逆位';
      return `${i + 1}. ${draw.position.label}：${draw.card.nameZh}（${dir}）`;
    })
    .join('\n');
  return `燭見塔羅解讀\n問題：${question}\n牌陣：${spread.label}\n\n牌面：\n${cards}\n\n總結：\n${reading.summary}\n\n接下來可以做的事：\n${reading.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
}

export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (!para) { lines.push(''); continue; }
    let line = '';
    for (const char of para) {
      const next = `${line}${char}`;
      if (ctx.measureText(next).width > maxWidth && line) {
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

export function useRitual() {
  const [phase, setPhase] = useState<RitualPhase>('idle');
  const [question, setQuestion] = useState('');
  const [selectedSpreadId, setSelectedSpreadId] = useState<SpreadId>(defaultSpread.id);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [choiceSlots, setChoiceSlots] = useState<ChoiceSlot[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [clarification, setClarification] = useState('');
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarificationError, setClarificationError] = useState('');
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('meanings');
  const [currentHistoryItemId, setCurrentHistoryItemId] = useState('');
  const [historyItems, setHistoryItems] = useState<ReadingHistoryItem[]>(() => loadReadingHistory());

  const readingStartedRef = useRef(false);
  const clarificationStartedRef = useRef(false);
  const clarificationRequestRef = useRef(0);

  // 抽牌全程保留底部 tab bar（不再進入沉浸模式隱藏）。

  const selectedSpread = getSpreadById(selectedSpreadId);
  const cardsToChoose = selectedSpread.positions.length;
  const trimmedQuestion = question.trim();

  const persistHistoryItem = useCallback((item: ReadingHistoryItem) => {
    const next = upsertReadingHistoryItem(item);
    setHistoryItems(next);
    setCurrentHistoryItemId(item.id);
    if (item.source === 'daily') updateDailyCardRecord(item);
  }, []);

  // focusing → 3 s delay → choosing
  useEffect(() => {
    if (phase !== 'focusing') return;
    const timer = window.setTimeout(() => {
      setChoiceSlots(createChoiceSlots());
      setSelectedIds([]);
      setDrawnCards([]);
      setRevealedCount(0);
      setReading(null);
      setUsedFallback(false);
      setFallbackMessage('');
      setClarification('');
      setIsClarifying(false);
      setClarificationError('');
      setActiveResultTab('meanings');
      setCurrentHistoryItemId('');
      readingStartedRef.current = false;
      clarificationStartedRef.current = false;
      clarificationRequestRef.current += 1;
      setPhase('choosing');
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // revealing → stagger-reveal → reading
  useEffect(() => {
    if (phase !== 'revealing') return;
    const timers = Array.from({ length: drawnCards.length }, (_, i) =>
      window.setTimeout(() => setRevealedCount(i + 1), 360 + i * 520),
    );
    const readingTimer = window.setTimeout(
      () => setPhase('reading'),
      720 + drawnCards.length * 520,
    );
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(readingTimer);
    };
  }, [drawnCards.length, phase]);

  // reading → call AI → done
  useEffect(() => {
    if (phase !== 'reading' || readingStartedRef.current || drawnCards.length !== cardsToChoose)
      return;
    readingStartedRef.current = true;

    async function readCards() {
      try {
        const geminiResult = await generateReading(trimmedQuestion, drawnCards, selectedSpread);
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
        setFallbackMessage('');
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
        setPhase('done');
      }
    }
    readCards();
  }, [cardsToChoose, drawnCards, persistHistoryItem, phase, selectedSpread, trimmedQuestion]);

  // done → auto-trigger second-layer clarification
  const requestClarification = useCallback(async () => {
    if (!reading || isClarifying) return;
    const requestId = ++clarificationRequestRef.current;
    setIsClarifying(true);
    setClarificationError('');
    try {
      const result = await generateClarification(trimmedQuestion, reading.cards, selectedSpread, {
        interpretations: reading.interpretations,
        summary: reading.summary,
        actions: reading.actions,
      });
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
      const fallback = buildClarificationFallback(trimmedQuestion, reading.cards, selectedSpread, {
        interpretations: reading.interpretations,
        summary: reading.summary,
        actions: reading.actions,
      });
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
      if (clarificationRequestRef.current === requestId) setIsClarifying(false);
    }
  }, [currentHistoryItemId, isClarifying, reading, selectedSpread, trimmedQuestion]);

  useEffect(() => {
    if (phase !== 'done' || !reading || clarificationStartedRef.current) return;
    clarificationStartedRef.current = true;
    void requestClarification();
  }, [phase, reading, requestClarification]);

  // ── Handlers ────────────────────────────────────────────

  const beginRitual = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      setHasTriedSubmit(true);
      if (!trimmedQuestion || phase !== 'idle') return;
      setPhase('focusing');
    },
    [phase, trimmedQuestion],
  );

  const changeSpread = useCallback(
    (id: SpreadId) => {
      if (phase !== 'idle') return;
      setSelectedSpreadId(id);
      setHasTriedSubmit(false);
    },
    [phase],
  );

  // §8.1: already-selected card can be deselected by tapping again
  const chooseCard = useCallback(
    (slotId: string) => {
      if (phase !== 'choosing') return;

      if (selectedIds.includes(slotId)) {
        setSelectedIds((prev) => prev.filter((id) => id !== slotId));
        return;
      }
      if (selectedIds.length >= cardsToChoose) return;

      const nextIds = [...selectedIds, slotId];
      setSelectedIds(nextIds);

      if (nextIds.length === cardsToChoose) {
        const picked = nextIds
          .map((id) => choiceSlots.find((s) => s.id === id))
          .filter((s): s is ChoiceSlot => Boolean(s));
        setDrawnCards(selectedSlotsToDrawnCards(picked, selectedSpread));
        setClarification('');
        setIsClarifying(false);
        setClarificationError('');
        setActiveResultTab('meanings');
        clarificationStartedRef.current = false;
        clarificationRequestRef.current += 1;
        window.setTimeout(() => setPhase('revealing'), 520);
      }
    },
    [cardsToChoose, choiceSlots, phase, selectedIds, selectedSpread],
  );

  // §8.3: skip the 3-second focusing delay
  const skipFocusing = useCallback(() => {
    if (phase !== 'focusing') return;
    setChoiceSlots(createChoiceSlots());
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedCount(0);
    setReading(null);
    setUsedFallback(false);
    setFallbackMessage('');
    setClarification('');
    setIsClarifying(false);
    setClarificationError('');
    setActiveResultTab('meanings');
    setCurrentHistoryItemId('');
    readingStartedRef.current = false;
    clarificationStartedRef.current = false;
    clarificationRequestRef.current += 1;
    setPhase('choosing');
  }, [phase]);

  // §8.2: skip revealing and show all cards immediately
  const skipRevealing = useCallback(() => {
    if (phase !== 'revealing') return;
    setRevealedCount(drawnCards.length);
    setPhase('reading');
  }, [drawnCards.length, phase]);

  const resetAll = useCallback(() => {
    setPhase('idle');
    setHasTriedSubmit(false);
    setChoiceSlots([]);
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedCount(0);
    setReading(null);
    setUsedFallback(false);
    setFallbackMessage('');
    setClarification('');
    setIsClarifying(false);
    setClarificationError('');
    setActiveResultTab('meanings');
    setCurrentHistoryItemId('');
    readingStartedRef.current = false;
    clarificationStartedRef.current = false;
    clarificationRequestRef.current += 1;
  }, []);

  const resetToHome = useCallback(() => {
    resetAll();
    setQuestion('');
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }, [resetAll]);

  const restartWithQuestion = useCallback(() => {
    if (!trimmedQuestion) { resetAll(); return; }
    setChoiceSlots([]);
    setSelectedIds([]);
    setDrawnCards([]);
    setRevealedCount(0);
    setReading(null);
    setUsedFallback(false);
    setFallbackMessage('');
    setClarification('');
    setIsClarifying(false);
    setClarificationError('');
    setActiveResultTab('meanings');
    setCurrentHistoryItemId('');
    readingStartedRef.current = false;
    clarificationStartedRef.current = false;
    clarificationRequestRef.current += 1;
    setPhase('focusing');
  }, [resetAll, trimmedQuestion]);

  const openHistoryItem = useCallback((item: ReadingHistoryItem) => {
    const spread = getSpreadById(item.spreadId);
    setSelectedSpreadId(spread.id);
    setQuestion(item.question);
    setPhase('done');
    setHasTriedSubmit(false);
    setChoiceSlots([]);
    setSelectedIds([]);
    setDrawnCards(item.reading.cards);
    setRevealedCount(item.reading.cards.length);
    setReading(item.reading);
    setUsedFallback(false);
    setFallbackMessage('');
    setClarification(item.clarification);
    setIsClarifying(false);
    setClarificationError('');
    setActiveResultTab('analysis');
    setCurrentHistoryItemId(item.id);
    readingStartedRef.current = true;
    clarificationStartedRef.current = true;
    clarificationRequestRef.current += 1;
  }, []);

  const toggleFavorite = useCallback(
    (itemId?: string) => {
      const id = itemId ?? currentHistoryItemId;
      if (!id) return;
      setHistoryItems(
        updateReadingHistoryItem(id, (item) => {
          const updated = { ...item, isFavorite: !item.isFavorite };
          if (updated.source === 'daily') updateDailyCardRecord(updated);
          return updated;
        }),
      );
    },
    [currentHistoryItemId],
  );

  const removeHistoryItem = useCallback(
    (id: string) => {
      setHistoryItems(deleteReadingHistoryItem(id));
      if (id === currentHistoryItemId) resetAll();
    },
    [currentHistoryItemId, resetAll],
  );

  const clearHistory = useCallback(() => {
    setHistoryItems(clearReadingHistory());
    setCurrentHistoryItemId('');
  }, []);

  const reloadHistory = useCallback(() => {
    setHistoryItems(loadReadingHistory());
  }, []);

  const currentHistoryItem =
    currentHistoryItemId ? historyItems.find((item) => item.id === currentHistoryItemId) : null;

  return {
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
    clarification,
    isClarifying,
    clarificationError,
    activeResultTab,
    setActiveResultTab,
    currentHistoryItemId,
    currentHistoryItem,
    historyItems,
    beginRitual,
    changeSpread,
    chooseCard,
    skipFocusing,
    skipRevealing,
    resetAll,
    resetToHome,
    restartWithQuestion,
    openHistoryItem,
    toggleFavorite,
    removeHistoryItem,
    clearHistory,
    reloadHistory,
  };
}

export type RitualApi = ReturnType<typeof useRitual>;
