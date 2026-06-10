import { TAROT_DECK } from '../data/tarot';
import type { DrawnCard, Orientation, ReadingResult, SpreadPosition, TarotCard } from '../types';

export const spreadPositions: SpreadPosition[] = [
  { id: 'situation', label: '狀況', prompt: '這張牌描述目前問題的表層與核心氣氛。' },
  { id: 'obstacle', label: '阻礙', prompt: '這張牌指出讓事情卡住的模式或盲點。' },
  { id: 'advice', label: '建議', prompt: '這張牌提供下一步可採取的態度與行動。' },
];

export function drawThreeCards(deck: TarotCard[] = TAROT_DECK, random: () => number = Math.random): DrawnCard[] {
  const pool = [...deck];

  return spreadPositions.map((position) => {
    const index = Math.floor(random() * pool.length);
    const [card] = pool.splice(index, 1);
    const orientation: Orientation = random() >= 0.5 ? 'upright' : 'reversed';

    return { card, orientation, position };
  });
}

export function buildInterpretation(question: string, cards: DrawnCard[]): ReadingResult {
  const normalizedQuestion = question.trim();
  const interpretations = cards.map(({ card, orientation, position }) => {
    const meaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
    const direction = orientation === 'upright' ? '正位' : '逆位';
    return `${position.label} - ${card.nameZh}${direction}：${position.prompt}${meaning}`;
  });

  const adviceCard = cards.find((item) => item.position.id === 'advice') ?? cards[cards.length - 1];
  const obstacleCard = cards.find((item) => item.position.id === 'obstacle') ?? cards[1];
  const summary = `針對「${normalizedQuestion}」，這組牌建議先承認 ${obstacleCard.card.keywords[0]} 相關的卡點，再用 ${adviceCard.card.nameZh} 提醒的方式調整下一步。請把解讀當作自我反思參考，重要決策仍應回到現實資訊與專業意見。`;

  return { cards, interpretations, summary };
}
