import type { DrawnCard, ReadingResult, SpreadDefinition } from '../types';

function formatCardLine(card: DrawnCard, index: number): string {
  const direction = card.orientation === 'upright' ? '正位' : '逆位';
  const meaning = card.orientation === 'upright' ? card.card.uprightMeaning : card.card.reversedMeaning;
  return `${index + 1}. ${card.position.label}：${card.card.nameZh}（${direction}）- 牌位：${card.position.prompt} 牌義：${meaning}`;
}

function formatCardPayload(card: DrawnCard, index: number, question: string, mode: 'oracle' | 'clear'): string {
  const orientation = card.orientation === 'upright' ? '正位' : '逆位';
  const meaning = card.orientation === 'upright' ? card.card.uprightMeaning : card.card.reversedMeaning;

  return `${index + 1}.
mode: "${mode}"
question: "${question}"
cardName: "${card.card.nameZh}"
orientation: "${orientation}"
spreadPosition: "${card.position.label}"
positionPrompt: "${card.position.prompt}"
cardMeaning: "${meaning}"`;
}

export function buildReadingPrompt(question: string, cards: DrawnCard[], spread: SpreadDefinition): string {
  return `你是一位神秘、優雅且溫柔的神諭塔羅傳訊者。這一次固定使用「神諭模式」，mode: "oracle"。
使用者想問的問題是：「${question}」
使用的牌陣是：「${spread.label}」。
牌陣說明：${spread.description}

抽到的牌如下，請依序解讀：
${cards.map((card, index) => formatCardPayload(card, index, question, 'oracle')).join('\n\n')}

請根據牌陣位置、正逆位、牌面意象與使用者問題進行解讀。
風格要求：
- 語氣要神秘、優雅、象徵化，像神諭低聲指出道路，但仍保有溫度。
- 不要使用條列式、編號列表或過度白話的教學口吻；每張牌請寫成流動的段落。
- 不要做絕對預言，不要使用恐嚇或操控式說法。
- 不要宣稱能準確預測未來，只能描述可能的象徵、提醒與反思方向。
- 若涉及醫療、法律、投資等高風險主題，只能提供反思角度，並提醒使用者尋求合格專業意見。

請回傳 JSON 格式，包含 interpretations 與 summary。
interpretations 必須剛好有 ${cards.length} 個字串，依照抽牌順序對應每張牌，每段約 200-400 字。
每個 interpretations[index] 必須依序包含：
1. 【牌卡名稱｜正位/逆位】
2. 牌面意象描述
3. 命運訊息
4. 隱藏課題
5. 結尾祝福
summary 是針對這個問題與整個牌陣的神諭式總結，約 200-400 字；請保持象徵性與安定感，仍避免絕對預言。`;
}

export function buildClarificationPrompt(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition,
  reading: Omit<ReadingResult, 'cards'>,
): string {
  return `你是一位專業、清晰且務實的塔羅顧問。這一次固定使用「清晰解牌模式」，mode: "clear"。
使用者已經完成一次神諭式解讀，但可能看不懂。請不要重新抽牌，也不要改變原本牌義，只根據以下資訊補充說明。
你的解析需結合塔羅象徵學、心理學、自我探索與問題分析，讓使用者知道這組牌在現實層面如何理解。

使用者問題：「${question}」
牌陣：「${spread.label}」- ${spread.description}
牌面資料：
${cards.map((card, index) => formatCardPayload(card, index, question, 'clear')).join('\n\n')}

原本每張牌解讀：
${reading.interpretations.map((text, index) => `${index + 1}. ${text}`).join('\n')}

原本總結：
${reading.summary}

請用繁體中文、清楚完整且依照情境的方式說明這組牌想提醒什麼。輸出必須固定使用以下六個標題，標題文字不可更改：
# 核心訊息
# 牌意解析
# 問題分析
# 可能發展
# 行動建議
# 結論

內容要求：
- # 牌意解析 要逐張說明牌位、正逆位與原本神諭訊息如何落到現實情境。
- # 問題分析 要指出使用者可能卡住、誤解、逃避或需要釐清的地方。
- # 可能發展 只能描述在不同選擇下可能出現的傾向，不可當成確定結果。
- # 行動建議 必須提供 3-5 點具體、可執行的建議。
- 全文控制在 400-800 字。

限制：
- 不要重新抽牌。
- 不要做絕對預言，不要恐嚇，不要使用宿命論。
- 不要宣稱可以精準預測未來或保證特定結果。
- 不要提供醫療、法律、投資指示；遇到高風險主題只提供反思角度並提醒找合格專業人士。
- 不要用模糊預言取代具體分析。`;
}

export async function generateReading(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition,
): Promise<Omit<ReadingResult, 'cards'>> {
  const result = await requestGemini<Omit<ReadingResult, 'cards'>>({
    mode: 'reading',
    question,
    cards,
    spread,
  });

  if (!Array.isArray(result.interpretations) || typeof result.summary !== 'string') {
    throw new Error('Gemini 回傳格式不正確');
  }

  return result;
}

export async function generateClarification(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition,
  reading: Omit<ReadingResult, 'cards'>,
): Promise<string> {
  const result = await requestGemini<{ clarification: string }>({
    mode: 'clarification',
    question,
    cards,
    spread,
    reading,
  });

  if (typeof result.clarification !== 'string' || result.clarification.trim().length === 0) {
    throw new Error('Gemini API 沒有回傳解惑內容');
  }

  return result.clarification.trim();
}

type GeminiRequestPayload =
  | {
      mode: 'reading';
      question: string;
      cards: DrawnCard[];
      spread: SpreadDefinition;
    }
  | {
      mode: 'clarification';
      question: string;
      cards: DrawnCard[];
      spread: SpreadDefinition;
      reading: Omit<ReadingResult, 'cards'>;
    };

async function requestGemini<T>(payload: GeminiRequestPayload): Promise<T> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gemini proxy request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
