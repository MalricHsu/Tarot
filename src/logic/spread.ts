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

export const oneCardPositions: SpreadPosition[] = [
  { id: 'guidance', label: '今日指引', prompt: '這張牌濃縮此刻最需要看見的提醒與可執行方向。' },
];

export const relationshipPositions: SpreadPosition[] = [
  { id: 'self', label: '你的狀態', prompt: '這張牌反映你在這段互動中的感受、期待與盲點。' },
  { id: 'other', label: '對方狀態', prompt: '這張牌描述對方可能呈現出的態度、需求或防衛。' },
  { id: 'connection', label: '關係能量', prompt: '這張牌指出雙方之間正在流動或卡住的核心模式。' },
  { id: 'challenge', label: '關係挑戰', prompt: '這張牌提醒目前最需要被誠實面對的阻力與誤解。' },
  { id: 'nextStep', label: '下一步', prompt: '這張牌給出較適合這段關係的溝通與行動方向。' },
];

export const careerPositions: SpreadPosition[] = [
  { id: 'careerCurrent', label: '工作現況', prompt: '這張牌描繪目前工作、事業或職涯選擇的整體狀態。' },
  { id: 'careerStrength', label: '可用優勢', prompt: '這張牌指出你可以運用的能力、資源或支持。' },
  { id: 'careerChallenge', label: '主要挑戰', prompt: '這張牌提醒現階段最需要處理的壓力、限制或盲點。' },
  { id: 'careerOpportunity', label: '機會方向', prompt: '這張牌揭示值得留意的可能性、窗口或轉折點。' },
  { id: 'nextStep', label: '下一步', prompt: '這張牌給出接下來最務實的行動方向。' },
];

export const choicePositions: SpreadPosition[] = [
  { id: 'optionA', label: '選擇 A', prompt: '這張牌描繪選項 A 可能帶出的狀態、代價與學習。' },
  { id: 'optionB', label: '選擇 B', prompt: '這張牌描繪選項 B 可能帶出的狀態、代價與學習。' },
  { id: 'choiceCore', label: '決策核心', prompt: '這張牌指出做選擇前最需要釐清的標準、需求或恐懼。' },
  { id: 'advice', label: '建議', prompt: '這張牌提供評估與行動時可以採取的態度。' },
];

export const spreads: SpreadDefinition[] = [
  {
    id: 'one-card-guidance',
    label: '一張快速指引',
    description: '用一張牌抓出當下最重要的提醒，適合每日覺察或簡短問題。',
    positions: oneCardPositions,
    exampleQuestions: [
      '今天我最需要看見什麼？',
      '面對這件事，我可以先調整哪個態度？',
      '此刻最適合我的下一步是什麼？',
    ],
  },
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
  {
    id: 'relationship-guidance',
    label: '關係牌陣',
    description: '從雙方狀態、關係能量、挑戰到下一步，適合感情、人際與合作關係。',
    positions: relationshipPositions,
    exampleQuestions: [
      '我和對方目前的互動真正卡在哪裡？',
      '這段關係現在最需要被理解的是什麼？',
      '我可以如何更成熟地面對這段關係？',
    ],
  },
  {
    id: 'career-guidance',
    label: '工作 / 事業牌陣',
    description: '聚焦工作現況、優勢、挑戰、機會與下一步，適合職涯與專案決策。',
    positions: careerPositions,
    exampleQuestions: [
      '我目前的工作方向適合怎麼調整？',
      '這個職涯選擇中，我最該注意什麼？',
      '我該如何推進眼前這個專案？',
    ],
  },
  {
    id: 'choice-ab',
    label: '選擇 A/B 牌陣',
    description: '比較兩個選項各自的傾向，並釐清真正影響決策的核心。',
    positions: choicePositions,
    exampleQuestions: [
      '我該選擇 A 還是 B？',
      '留在原本方向與嘗試新選項，各自提醒我什麼？',
      '做這個選擇前，我最需要釐清哪個標準？',
    ],
  },
];

export const defaultSpread = getSpreadDefinition('five-card-depth');

export function getSpreadById(id: SpreadId): SpreadDefinition {
  return spreads.find((spread) => spread.id === id) ?? defaultSpread;
}

function getSpreadDefinition(id: SpreadId): SpreadDefinition {
  const spread = spreads.find((item) => item.id === id);
  if (!spread) {
    throw new Error(`Missing spread definition: ${id}`);
  }
  return spread;
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

/**
 * 大小牌比例判讀。一般 78 張牌陣大牌約佔 28%（大牌:小牌 ≈ 1:2.5）。
 * 比例本身是訊號：大牌偏多＝精神層面影響大、能掌控的少；小牌偏多＝具體事件、可改變空間大。
 * 牌數 < 3 時不具參考意義，回傳 null。
 */
export function analyzeArcanaBalance(cards: DrawnCard[]): {
  majorCount: number;
  minorCount: number;
  pct: number;
  note: string;
} | null {
  const total = cards.length;
  if (total < 3) return null;

  const majorCount = cards.filter(({ card }) => card.arcana === 'major').length;
  const minorCount = total - majorCount;
  const pct = Math.round((majorCount / total) * 100);

  let note: string;
  if (majorCount === 0) {
    note = `本次 ${total} 張全為小牌，這件事主要落在具體、日常、能實際操作的層面，影響較短期，你靠自己行動就能改變的空間很大。`;
  } else if (pct < 15) {
    note = `本次 ${total} 張中小牌明顯偏多（大牌 ${majorCount} 張），這件事偏向具體事件，影響較短期，你能靠自己行動改變的空間較大。`;
  } else if (pct < 43) {
    note = `本次 ${total} 張中大牌 ${majorCount}、小牌 ${minorCount}，比例接近常態，精神層面與現實事件大致並重。`;
  } else if (pct < 70) {
    note = `本次 ${total} 張中大牌偏多（${majorCount} 張，約 ${pct}%），這件事影響很大、你也很重視，但多半在內心進行，靠自己能直接掌控的不多，較需要時間沉澱而非急於行動。`;
  } else {
    note = `本次 ${total} 張幾乎都是大牌（${majorCount} 張，約 ${pct}%），這件事深刻牽動你的價值與信念、影響長遠，卻幾乎不在你能直接掌控的範圍內，多半只能調整心態、耐心等待。`;
  }

  return { majorCount, minorCount, pct, note };
}

export function buildInterpretation(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition = getSpreadById('three-card-guidance'),
): ReadingResult {
  const normalizedQuestion = question.trim() || '這個問題';
  const interpretations = cards.map(({ card, orientation, position }) => {
    const meaning = orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning;
    const direction = orientation === 'upright' ? '正位' : '逆位';
    const orientationFocus =
      orientation === 'upright'
        ? `以正位出現時，${card.nameZh}把焦點放在${meaning}，提醒你這股力量已經可以被看見，也可能正在成為推動局面的主要資源。`
        : `以逆位出現時，${card.nameZh}把焦點放在${meaning}，提醒你先辨認受阻、失衡或尚未整合的部分，不必急著把它解讀成壞結果。`;
    const keyword = card.keywords[0];

    return `【${card.nameZh}｜${direction}】在「${position.label}」的位置上，這張牌先回應的是「${normalizedQuestion}」裡最需要被照亮的一層。${position.prompt}因此它不是單純描述事件會如何發生，而是在指出你此刻與問題互動的方式：哪些感受正在浮現，哪些判斷還需要沉澱，哪些現實條件不宜被忽略。${orientationFocus}放回你的提問來看，${keyword}可能是這張牌最想讓你停下來觀察的線索；它也許代表你已經握有某種能力，或正被同一種模式反覆牽動。這張牌的提醒是，先不要急著追問唯一答案，而是把注意力放回可驗證的事實、身體的反應與真實需求。接下來，你可以問自己：我正在害怕什麼，又有哪些選項其實已經在眼前？若願意把問題拆小，從一個可完成的行動開始，${card.nameZh}會成為一面鏡子，幫你看清下一步該帶著什麼態度前進。`;
  });

  const nextCard =
    cards.find((item) => item.position.id === 'nextStep') ??
    cards.find((item) => item.position.id === 'advice') ??
    cards.find((item) => item.position.id === 'guidance') ??
    cards[cards.length - 1];
  const challengeCard =
    cards.find((item) => item.position.id === 'challenge') ??
    cards.find((item) => item.position.id === 'obstacle') ??
    cards.find((item) => item.position.id === 'careerChallenge') ??
    cards[1] ??
    cards[0];
  const cardFlow = cards
    .map(({ card, orientation, position }) => {
      const direction = orientation === 'upright' ? '正位' : '逆位';
      return `${position.label}的${card.nameZh}${direction}`;
    })
    .join('、');
  const balance = analyzeArcanaBalance(cards);
  const balanceLine = balance ? `${balance.note}` : '';
  const summary = `針對「${normalizedQuestion}」，${spread.label}呈現的整體脈絡是：${cardFlow}共同把焦點放在你如何辨認現況、處理阻力，並把下一步落回可執行的選擇。${balanceLine}這組牌先提醒你看見 ${challengeCard.card.nameZh} 帶出的${challengeCard.card.keywords[0]}相關卡點；它可能不是單一事件，而是反覆影響判斷的模式。真正能往前推動的方向，則落在 ${nextCard.card.nameZh} 所象徵的${nextCard.card.keywords[0]}：先整理資訊、承認感受，再選一個最小但具體的行動。請把解讀當作自我反思參考，重要決策仍應回到現實資訊與專業意見。`;

  return { cards, interpretations, summary, actions: buildReadingActions(cards) };
}

export function buildReadingActions(cards: DrawnCard[]): string[] {
  const nextCard =
    cards.find((item) => item.position.id === 'nextStep') ??
    cards.find((item) => item.position.id === 'advice') ??
    cards.find((item) => item.position.id === 'guidance') ??
    cards[cards.length - 1];
  const challengeCard =
    cards.find((item) => item.position.id === 'challenge') ??
    cards.find((item) => item.position.id === 'obstacle') ??
    cards.find((item) => item.position.id === 'careerChallenge') ??
    cards[1] ??
    cards[0];
  const firstCard = cards[0];

  return [
    `寫下與「${firstCard.card.keywords[0]}」有關的三個已知事實，先把感覺和推測分開。`,
    `針對 ${challengeCard.card.nameZh} 提醒的卡點，選一件今天能確認或溝通的小事。`,
    `用 ${nextCard.card.nameZh} 的「${nextCard.card.keywords[0]}」作為行動標準，安排一個 24 小時內可完成的下一步。`,
  ];
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
    cards.find((item) => item.position.id === 'careerChallenge') ??
    cards[1] ??
    cards[0];
  const nextCard =
    cards.find((item) => item.position.id === 'nextStep') ??
    cards.find((item) => item.position.id === 'advice') ??
    cards.find((item) => item.position.id === 'guidance') ??
    cards[cards.length - 1];

  return `# 重點摘要
針對「${normalizedQuestion}」：先把問題從情緒和想像拉回可觀察的現實。最關鍵的一步是處理${challengeCard.card.keywords[0]}，然後順著${nextCard.card.nameZh}的方向做一個具體調整。

# 牌面解讀
${cardLines.join('\n')}

# 你的處境
你現在大概卡在「知道自己有感覺，但還沒把感覺整理成判斷依據」。${challengeCard.card.nameZh}指出的${challengeCard.card.keywords[0]}是這次最需要釐清的地方——可能是拖延、過度猜測、等別人給答案，或忽略了真正的限制。同時，${nextCard.card.nameZh}提示你手上其實有可用的資源，只是還沒接上。${analyzeArcanaBalance(cards)?.note ?? ''}

# 接下來怎麼做
1. 寫下三個已知事實，和三個只是你的猜測——分清楚這兩者。
2. 把最擔心的結果改寫成一個可以實際驗證的問題。
3. 選一個 24 小時內能完成的小行動，先動起來，不要要求自己一次解決全部。

# 一句收尾
答案不在命運手上，在你接下來那個具體選擇裡。先處理${challengeCard.card.keywords[0]}，事情就會比現在清楚。`;
}
