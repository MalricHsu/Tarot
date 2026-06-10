import { describe, expect, it } from 'vitest';
import { TAROT_DECK } from '../data/tarot';
import { buildInterpretation, drawThreeCards } from './spread';

describe('tarot deck data', () => {
  it('contains 78 complete cards', () => {
    expect(TAROT_DECK).toHaveLength(78);

    for (const card of TAROT_DECK) {
      expect(card.id).toBeTruthy();
      expect(card.nameZh).toBeTruthy();
      expect(card.nameEn).toBeTruthy();
      expect(card.image).toMatch(/^\/cards\/.+\.svg$/);
      expect(card.uprightMeaning).toBeTruthy();
      expect(card.reversedMeaning).toBeTruthy();
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

describe('buildInterpretation', () => {
  it('returns one interpretation per card and a summary', () => {
    const cards = drawThreeCards(TAROT_DECK, () => 0.75);
    const result = buildInterpretation('我該如何面對目前的工作選擇？', cards);

    expect(result.interpretations).toHaveLength(3);
    expect(result.summary).toContain('工作選擇');
  });
});
