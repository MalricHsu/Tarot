import { TAROT_DECK } from '../data/tarot';
import type {
  DrawnCard,
  Orientation,
  ReadingResult,
  SpreadDefinition,
  SpreadId,
  SpreadPosition,
  TarotCard,
} from '../types';

export const spreadPositions: SpreadPosition[] = [
  { id: 'situation', label: '狀況', prompt: '這張牌描述目前問題的表層與核心氣氛。' },
  { id: 'obstacle', label: '阻礙', prompt: '這張牌指出讓事情卡住的模式或盲點。' },
  { id: 'advice', label: '建議', prompt: '這張牌提供下一步可採取的態度與行動。' },
];

export const fiveCardPositions: SpreadPosition[] = [
  { id: 'current', label: '現況', prompt: '這張牌描繪此刻正在發生的狀態與氛圍。' },
  { id: 'root', label: '根源', prompt: '這張牌指出問題背後較深層的原因或情緒來源。' },
  { id: 'challenge', label: '挑戰', prompt: '這張牌提醒目前最需要面對的阻力、盲點或考驗。' },
  { id: 'resource', label: '資源', prompt: '這張牌代表你已經擁有、可以借力或重新看見的支持。' },
  { id: 'nextStep', label: '下一步', prompt: '這張牌給出接下來最適合採取的態度與行動方向。' },
];

export const spreads: SpreadDefinition[] = [
  {
    id: 'five-card-depth',
    label: '五張深入指引',
    description: '從現況、根源、挑戰、資源到下一步，適合需要完整釐清的問題。',
    positions: fiveCardPositions,
    exampleQuestions: [
      '我該如何看待這段關係目前的狀態？',
      '這個工作選擇背後，我真正需要注意什麼？',
      '我現在卡住的原因，以及下一步可以怎麼走？',
    ],
  },
  {
    id: 'three-card-guidance',
    label: '三張快速指引',
    description: '用狀況、阻礙、建議快速抓出問題重點，適合日常提問。',
    positions: spreadPositions,
    exampleQuestions: [
      '我該如何面對目前的工作選擇？',
      '這段關係現在最需要我理解什麼？',
      '今天我可以用什麼態度處理這件事？',
    ],
  },
];

export const defaultSpread = spreads[0];

export function getSpreadById(id: SpreadId): SpreadDefinition {
  return spreads.find((spread) => spread.id === id) ?? defaultSpread;
}

export function drawCardsForSpread(
  spread: SpreadDefinition,
  deck: TarotCard[] = TAROT_DECK,
  random: () => number = Math.random,
): DrawnCard[] {
  const pool = [...deck];

  return spread.positions.map((position) => {
    const index = Math.floor(random() * pool.length);
    const [card] = pool.splice(index, 1);
    const orientation: Orientation = random() >= 0.5 ? 'upright' : 'reversed';

    return { card, orientation, position };
  });
}

export function drawThreeCards(deck: TarotCard[] = TAROT_DECK, random: () => number = Math.random): DrawnCard[] {
  return drawCardsForSpread(getSpreadById('three-card-guidance'), deck, random);
}

export function buildInterpretation(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition = getSpreadById('three-card-guidance'),
): ReadingResult {
  const normalizedQuestion = question.trim();
  const interpretations = cards.map(({ card, orientation, position }) => {
    const meaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
    const direction = orientation === 'upright' ? '正位' : '逆位';
    return `${position.label} - ${card.nameZh}${direction}：${position.prompt}${meaning}`;
  });

  const nextCard =
    cards.find((item) => item.position.id === 'nextStep') ??
    cards.find((item) => item.position.id === 'advice') ??
    cards[cards.length - 1];
  const challengeCard =
    cards.find((item) => item.position.id === 'challenge') ??
    cards.find((item) => item.position.id === 'obstacle') ??
    cards[1] ??
    cards[0];
  const summary = `針對「${normalizedQuestion}」，${spread.label}提醒你先看見 ${challengeCard.card.keywords[0]} 相關的卡點，再用 ${nextCard.card.nameZh} 帶出的方向調整下一步。請把解讀當作自我反思參考，重要決策仍應回到現實資訊與專業意見。`;

  return { cards, interpretations, summary };
}

export function buildClarificationFallback(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition,
  reading: Omit<ReadingResult, 'cards'>,
): string {
  const normalizedQuestion = question.trim() || '這個問題';
  const cardLines = cards.map(({ card, orientation, position }, index) => {
    const direction = orientation === 'upright' ? '正位' : '逆位';
    const meaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
    const originalMessage = reading.interpretations[index] ?? meaning;

    return `${index + 1}. ${position.label}：${card.nameZh}${direction}。${position.prompt}${meaning}原本解讀可落到現實層面理解為：${originalMessage}`;
  });
  const challengeCard =
    cards.find((item) => item.position.id === 'challenge') ??
    cards.find((item) => item.position.id === 'obstacle') ??
    cards[1] ??
    cards[0];
  const nextCard =
    cards.find((item) => item.position.id === 'nextStep') ??
    cards.find((item) => item.position.id === 'advice') ??
    cards[cards.length - 1];

  return `# 核心訊息
針對「${normalizedQuestion}」，${spread.label}主要提醒你：先把問題從情緒或想像拉回可觀察的現實。這組牌不是要替你決定結果，而是指出目前最需要被看見的模式，以及下一步可以如何調整。

# 牌意解析
${cardLines.join('\n')}

# 問題分析
你現在可能卡在「知道自己有感覺，但還沒有把感覺整理成判斷依據」。${challengeCard.card.nameZh}提示的${challengeCard.card.keywords[0]}是這次最需要釐清的地方：它可能代表拖延、過度猜測、期待別人給答案，或忽略了真正的限制條件。

# 可能發展
如果你繼續用原本方式處理，事情大多會沿著目前的慣性前進，卡點也會重複出現。若你願意把問題拆小、補齊資訊，並用更清楚的界線行動，${nextCard.card.nameZh}所代表的方向會比較容易成為可用資源。

# 行動建議
1. 先寫下三個已知事實，和三個只是猜測的部分。
2. 把最擔心的結果改寫成可以驗證的問題。
3. 選一個 24 小時內能完成的小行動，不要一次要求自己解決全部。
4. 若問題涉及醫療、法律或投資，請把塔羅當反思輔助，實際決策要諮詢合格專業人士。

# 結論
這組牌的重點不是叫你等待命運給答案，而是提醒你把注意力放回可掌握的選擇。先處理${challengeCard.card.keywords[0]}，再順著${nextCard.card.nameZh}提示的方向做一個具體調整，答案會比現在更清楚。`;
}
