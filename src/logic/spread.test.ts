import { afterEach, describe, expect, it, vi } from 'vitest';
import { TAROT_DECK } from '../data/tarot';
import { buildClarificationPrompt, buildReadingPrompt, generateClarification, generateReading } from './gemini';
import { drawDailyCard, trimReadingHistory } from './storage';
import {
  buildClarificationFallback,
  buildInterpretation,
  drawCardsForSpread,
  drawThreeCards,
  getSpreadById,
} from './spread';

describe('tarot deck data', () => {
  it('contains 78 complete cards', () => {
    expect(TAROT_DECK).toHaveLength(78);

    for (const card of TAROT_DECK) {
      expect(card.id).toBeTruthy();
      expect(card.nameZh).toBeTruthy();
      expect(card.nameEn).toBeTruthy();
      expect(card.image).toMatch(/\/cards\/.+\.svg$/);
      expect(card.uprightMeaning).toBeTruthy();
      expect(card.reversedMeaning).toBeTruthy();
      expect(card.visualDescription.length).toBeGreaterThan(20);
      expect(card.cardMessage.length).toBeGreaterThan(20);
      expect(card.generalInterpretation.length).toBeGreaterThan(20);
      expect(card.keywords.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('drawThreeCards', () => {
  it('draws three unique cards', () => {
    const draws = drawThreeCards(TAROT_DECK, () => 0);
    const ids = draws.map((draw) => draw.card.id);

    expect(draws).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it('can produce upright and reversed orientations', () => {
    const randomValues = [0, 0.9, 0, 0.1, 0, 0.9];
    const draws = drawThreeCards(TAROT_DECK, () => randomValues.shift() ?? 0.5);

    expect(draws.map((draw) => draw.orientation)).toEqual(['upright', 'reversed', 'upright']);
  });
});

describe('drawCardsForSpread', () => {
  it('draws three unique cards for the three-card spread', () => {
    const spread = getSpreadById('three-card-guidance');
    const draws = drawCardsForSpread(spread, TAROT_DECK, () => 0);
    const ids = draws.map((draw) => draw.card.id);

    expect(draws).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(draws.map((draw) => draw.position.label)).toEqual(['狀況', '阻礙', '建議']);
  });

  it('draws five unique cards for the five-card spread', () => {
    const spread = getSpreadById('five-card-depth');
    const draws = drawCardsForSpread(spread, TAROT_DECK, () => 0);
    const ids = draws.map((draw) => draw.card.id);

    expect(draws).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(draws.map((draw) => draw.position.label)).toEqual(['現況', '根源', '挑戰', '資源', '下一步']);
  });

  it('draws unique cards for every configured spread position count', () => {
    const spreadIds = [
      'one-card-guidance',
      'three-card-guidance',
      'five-card-depth',
      'relationship-guidance',
      'career-guidance',
      'choice-ab',
    ] as const;

    for (const spreadId of spreadIds) {
      const spread = getSpreadById(spreadId);
      const draws = drawCardsForSpread(spread, TAROT_DECK, () => 0);
      const ids = draws.map((draw) => draw.card.id);

      expect(draws).toHaveLength(spread.positions.length);
      expect(new Set(ids).size).toBe(spread.positions.length);
    }
  });
});

describe('buildInterpretation', () => {
  it('returns one interpretation per card and a summary', () => {
    const cards = drawThreeCards(TAROT_DECK, () => 0.75);
    const result = buildInterpretation('我該如何面對目前的工作選擇？', cards);

    expect(result.interpretations).toHaveLength(3);
    expect(result.summary).toContain('工作選擇');
    expect(result.actions).toHaveLength(3);
    expect(result.interpretations[0].length).toBeGreaterThan(180);
    expect(result.interpretations[0]).toContain('工作選擇');
    expect(result.interpretations[0]).toContain(cards[0].position.label);
    expect(result.interpretations[0]).toContain(cards[0].card.nameZh);
    expect(result.interpretations[0]).toMatch(/正位|逆位/);
    expect(result.interpretations[0]).toContain('接下來');
  });

  it('returns one fallback interpretation per five-card spread position', () => {
    const spread = getSpreadById('five-card-depth');
    const cards = drawCardsForSpread(spread, TAROT_DECK, () => 0.75);
    const result = buildInterpretation('我現在卡住的原因是什麼？', cards, spread);

    expect(result.interpretations).toHaveLength(5);
    expect(result.actions).toHaveLength(3);
    expect(result.summary).toContain('五張深入指引');
    for (const [index, interpretation] of result.interpretations.entries()) {
      expect(interpretation.length).toBeGreaterThan(180);
      expect(interpretation).toContain(cards[index].position.label);
      expect(interpretation).toContain(cards[index].card.nameZh);
      expect(interpretation).toMatch(/正位|逆位/);
      expect(interpretation).toContain('我現在卡住的原因');
    }
  });
});

describe('buildClarificationFallback', () => {
  it('returns readable clarification sections when Gemini clarification is unavailable', () => {
    const spread = getSpreadById('three-card-guidance');
    const cards = drawCardsForSpread(spread, TAROT_DECK, () => 0.75);
    const reading = buildInterpretation('我該如何面對目前的工作選擇？', cards, spread);
    const fallback = buildClarificationFallback('我該如何面對目前的工作選擇？', cards, spread, {
      interpretations: reading.interpretations,
      summary: reading.summary,
      actions: reading.actions,
    });

    expect(fallback).toContain('# 核心訊息');
    expect(fallback).toContain('# 牌意解析');
    expect(fallback).toContain('# 問題分析');
    expect(fallback).toContain('# 可能發展');
    expect(fallback).toContain('# 行動建議');
    expect(fallback).toContain('# 結論');
    expect(fallback).toContain('狀況');
    expect(fallback).toContain('阻礙');
    expect(fallback).toContain('建議');
  });
});

describe('buildReadingPrompt', () => {
  it('uses oracle mode with symbolic tone, JSON shape and safety limits', () => {
    const spread = getSpreadById('five-card-depth');
    const cards = drawCardsForSpread(spread, TAROT_DECK, () => 0.75);
    const prompt = buildReadingPrompt('我該如何選擇？', cards, spread);

    expect(prompt).toContain('五張深入指引');
    expect(prompt).toContain('現況');
    expect(prompt).toContain('下一步');
    expect(prompt).toContain('神諭模式');
    expect(prompt).toContain('mode: "oracle"');
    expect(prompt).toContain('神秘、優雅、象徵化');
    expect(prompt).toContain('不要使用條列式');
    expect(prompt).toContain('不要做絕對預言');
    expect(prompt).toContain('不要宣稱能準確預測未來');
    expect(prompt).toContain('醫療、法律、投資');
    expect(prompt).toContain('基本牌義會由本地資料直接顯示');
    expect(prompt).toContain('interpretations 只是相容欄位');
    expect(prompt).toContain('必須剛好有 5 個字串');
    expect(prompt).toContain('每句 40-80 字');
    expect(prompt).toContain('不要取代本地固定牌義');
    expect(prompt).toContain('summary 是主要輸出');
    expect(prompt).toContain('actions 必須剛好有 3 個字串');
    expect(prompt).toContain('約 350-650 字');
    expect(prompt).toContain('主要卡點、可用資源與下一步提醒');
  });
});

describe('buildClarificationPrompt', () => {
  it('uses clear mode with fixed sections, action advice and safety limits', () => {
    const spread = getSpreadById('three-card-guidance');
    const cards = drawCardsForSpread(spread, TAROT_DECK, () => 0.75);
    const reading = buildInterpretation('我該如何面對目前的工作選擇？', cards, spread);
    const prompt = buildClarificationPrompt('我該如何面對目前的工作選擇？', cards, spread, {
      interpretations: reading.interpretations,
      summary: reading.summary,
      actions: reading.actions,
    });

    expect(prompt).toContain('清晰解牌模式');
    expect(prompt).toContain('mode: "clear"');
    expect(prompt).toContain('塔羅象徵學、心理學、自我探索與問題分析');
    expect(prompt).toContain('# 核心訊息');
    expect(prompt).toContain('# 牌意解析');
    expect(prompt).toContain('# 問題分析');
    expect(prompt).toContain('# 可能發展');
    expect(prompt).toContain('# 行動建議');
    expect(prompt).toContain('# 結論');
    expect(prompt).toContain('# 行動建議 必須提供 3-5 點具體、可執行的建議');
    expect(prompt).toContain('全文控制在 400-800 字');
    expect(prompt).toContain('不要使用宿命論');
    expect(prompt).toContain('不要宣稱可以精準預測未來');
    expect(prompt).toContain('不要用模糊預言取代具體分析');
  });
});

describe('Gemini frontend client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts reading requests to the server proxy without an API key', async () => {
    const spread = getSpreadById('three-card-guidance');
    const cards = drawCardsForSpread(spread, TAROT_DECK, () => 0.75);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ interpretations: ['a', 'b', 'c'], summary: 'summary', actions: ['one', 'two', 'three'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateReading('我該如何選擇？', cards, spread);

    expect(result.summary).toBe('summary');
    expect(result.actions).toEqual(['one', 'two', 'three']);
    expect(fetchMock).toHaveBeenCalledWith('/api/gemini', expect.objectContaining({ method: 'POST' }));
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(init.body));
    expect(payload.mode).toBe('reading');
    expect(payload.question).toBe('我該如何選擇？');
    expect(payload.spread.id).toBe('three-card-guidance');
    expect(payload.cards).toHaveLength(3);
    expect(JSON.stringify(payload)).not.toContain('GEMINI_API_KEY');
    expect(JSON.stringify(payload)).not.toContain('apiKey');
  });

  it('posts clarification requests with the original reading context', async () => {
    const spread = getSpreadById('three-card-guidance');
    const cards = drawCardsForSpread(spread, TAROT_DECK, () => 0.75);
    const reading = buildInterpretation('我該如何面對目前的工作選擇？', cards, spread);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ clarification: '# 核心訊息\n保持清楚。' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateClarification('我該如何面對目前的工作選擇？', cards, spread, {
      interpretations: reading.interpretations,
      summary: reading.summary,
      actions: reading.actions,
    });

    expect(result).toContain('# 核心訊息');
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(init.body));
    expect(payload.mode).toBe('clarification');
    expect(payload.reading.interpretations).toHaveLength(3);
    expect(payload.reading.summary).toBe(reading.summary);
  });
});

describe('daily card and history storage helpers', () => {
  it('returns the same daily card for the same Taipei date and changes across dates', () => {
    const first = drawDailyCard('2026-06-11');
    const repeat = drawDailyCard('2026-06-11');
    const next = drawDailyCard('2026-06-12');

    expect(first.card.id).toBe(repeat.card.id);
    expect(first.orientation).toBe(repeat.orientation);
    expect(`${first.card.id}-${first.orientation}`).not.toBe(`${next.card.id}-${next.orientation}`);
  });

  it('trims non-favorite history without removing favorites', () => {
    const cards = drawThreeCards(TAROT_DECK, () => 0.75);
    const reading = buildInterpretation('測試問題', cards);
    const items = Array.from({ length: 55 }, (_, index) => ({
      id: `item-${index}`,
      createdAt: new Date(2026, 0, index + 1).toISOString(),
      question: `問題 ${index}`,
      spreadId: 'three-card-guidance' as const,
      spreadLabel: '三張快速指引',
      reading,
      clarification: '',
      isFavorite: index < 3,
      source: 'question' as const,
    }));

    const trimmed = trimReadingHistory(items);

    expect(trimmed.filter((item) => item.isFavorite)).toHaveLength(3);
    expect(trimmed.filter((item) => !item.isFavorite)).toHaveLength(50);
    expect(trimmed.some((item) => item.id === 'item-0')).toBe(true);
    expect(trimmed.some((item) => item.id === 'item-1')).toBe(true);
    expect(trimmed.some((item) => item.id === 'item-2')).toBe(true);
  });
});
