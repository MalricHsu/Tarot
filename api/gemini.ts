// 此檔為 Vercel serverless function，必須完全自包含：
// 不可 import 任何 ../src/ 的執行期模組，否則在 Vercel ESM 環境下
// 會因無法解析路徑而導致 FUNCTION_INVOCATION_FAILED。

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

type Orientation = 'upright' | 'reversed';

interface TarotCard {
  nameZh: string;
  uprightMeaning: string;
  reversedMeaning: string;
  visualDescription: string;
  cardMessage: string;
  generalInterpretation: string;
}

interface SpreadPosition {
  label: string;
  prompt: string;
}

interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position: SpreadPosition;
}

interface SpreadDefinition {
  label: string;
  description: string;
}

interface ReadingResult {
  interpretations: string[];
  summary: string;
  actions: string[];
}

type GeminiRequestBody =
  | {
      mode: 'reading';
      question: string;
      spread: SpreadDefinition;
      cards: DrawnCard[];
    }
  | {
      mode: 'clarification';
      question: string;
      spread: SpreadDefinition;
      cards: DrawnCard[];
      reading: ReadingResult;
    };

// ── Model fallback list ─────────────────────────────────────────
// 從最輕量的模型開始，quota 不足時自動 fallback 到下一個。
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
] as const;

type GeminiModel = (typeof GEMINI_MODELS)[number];

// ── Prompt builders ─────────────────────────────────────────────

function formatCardPayload(
  card: DrawnCard,
  index: number,
  question: string,
  mode: 'oracle' | 'clear',
): string {
  const orientation = card.orientation === 'upright' ? '正位' : '逆位';
  const meaning =
    card.orientation === 'upright' ? card.card.uprightMeaning : card.card.reversedMeaning;

  return `${index + 1}.
mode: "${mode}"
question: "${question}"
cardName: "${card.card.nameZh}"
orientation: "${orientation}"
spreadPosition: "${card.position.label}"
positionPrompt: "${card.position.prompt}"
cardMeaning: "${meaning}"
visualDescription: "${card.card.visualDescription}"
cardMessage: "${card.card.cardMessage}"
generalInterpretation: "${card.card.generalInterpretation}"`;
}

function buildReadingPrompt(question: string, cards: DrawnCard[], spread: SpreadDefinition): string {
  return `你是一位神秘、優雅且溫柔的神諭塔羅傳訊者。這一次固定使用「神諭模式」，mode: "oracle"。
使用者想問的問題是：「${question}」
使用的牌陣是：「${spread.label}」。
牌陣說明：${spread.description}

抽到的牌如下，這些牌的基本牌義會由本地資料直接顯示；你只需要參考它們來做整體統整：
${cards.map((card, index) => formatCardPayload(card, index, question, 'oracle')).join('\n\n')}

請根據使用者問題、牌陣位置、正逆位、牌面意象與全部抽牌之間的關係，產生整體解簽。
風格要求：
- 語氣要神秘、優雅、象徵化，像神諭低聲指出道路，但仍保有溫度。
- 不要使用條列式、編號列表或過度白話的教學口吻；請寫成流動的段落。
- 不要做絕對預言，不要使用恐嚇或操控式說法。
- 不要宣稱能準確預測未來，只能描述可能的象徵、提醒與反思方向。
- 若涉及醫療、法律、投資等高風險主題，只能提供反思角度，並提醒使用者尋求合格專業意見。

請回傳 JSON 格式，包含 interpretations、summary 與 actions。
interpretations 只是相容欄位，必須剛好有 ${cards.length} 個字串，依照抽牌順序各用 1 句話概括該牌在牌陣中的作用即可，每句 40-80 字，不要取代本地固定牌義。
summary 是主要輸出，請針對這個問題與整個牌陣做神諭式總解，約 350-650 字；請整合每張牌的互動關係、主要卡點、可用資源與下一步提醒，保持象徵性與安定感，仍避免絕對預言。
actions 必須剛好有 3 個字串，每個都是具體、可在 24-72 小時內執行的行動，不要空泛祝福或預言。`;
}

function buildClarificationPrompt(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition,
  reading: ReadingResult,
): string {
  return `你是一個懂塔羅的教練。使用者剛看完一段神諭式（象徵、優雅）的解讀，現在需要你把它落地。
你的任務不是重新抽牌、也不是改寫牌義，而是把這組牌翻譯成「現實上該怎麼理解、怎麼做」。

口氣定義：
- 務實、直接、聚焦行動。像一個懂塔羅、也懂現實的教練在跟對方講話。
- 不囉嗦、不堆砌華麗詞藻、不灌雞湯。溫度適中——不冷漠，但也不過度安慰。
- 跟原本的神諭解讀形成對比：神諭虛幻象徵，你清楚落地。
- 用「你」直接稱呼對方。

使用者問題：「${question}」
牌陣：「${spread.label}」- ${spread.description}
牌面資料：
${cards.map((card, index) => formatCardPayload(card, index, question, 'clear')).join('\n\n')}

原本每張牌解讀：
${reading.interpretations.map((text, index) => `${index + 1}. ${text}`).join('\n')}

原本總結：
${reading.summary}

請用繁體中文輸出，固定使用以下五個標題，標題文字不可更改、順序不可調換：
# 重點摘要
# 牌面解讀
# 你的處境
# 接下來怎麼做
# 一句收尾

內容要求：
- # 重點摘要：用 1-2 句話直接講結論。把最重要的洞察放最前面。
- # 牌面解讀：逐張簡潔說明每張牌在這個問題裡扮演什麼角色（牌位＋正逆位），不要重述神諭、點到為止。
- # 你的處境：綜合分析現況——你卡在哪、有什麼資源、需要看清什麼。
- # 接下來怎麼做：給 2-4 點具體、可執行的行動，每點都要能真的去做（不要含糊）。
- # 一句收尾：一句簡短的提醒或鼓勵，不要說教。
- 全文控制在 300-600 字，精簡優先。

限制：
- 不要重新抽牌。
- 不要做絕對預言、不要恐嚇、不要宿命論，不要保證特定結果。
- 不要提供醫療、法律、投資指示；遇到高風險主題只提供反思角度並提醒找合格專業人士。
- 不要用模糊預言取代具體分析。`;
}

// ── Response schema ─────────────────────────────────────────────

const readingResponseSchema = (cardCount: number) => ({
  type: 'OBJECT',
  properties: {
    interpretations: {
      type: 'ARRAY',
      description: `相容欄位，必須剛好包含 ${cardCount} 個字串元素；每個元素只需簡短概括單張牌在牌陣中的作用。`,
      items: { type: 'STRING' },
    },
    summary: {
      type: 'STRING',
      description: '針對使用者問題、牌陣位置與全部抽牌的主要整體解簽。',
    },
    actions: {
      type: 'ARRAY',
      description: '剛好 3 個具體、可在 24-72 小時內執行的行動。',
      items: { type: 'STRING' },
    },
  },
  required: ['interpretations', 'summary', 'actions'],
});

// ── Validation helpers ──────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidBody(body: unknown): body is GeminiRequestBody {
  if (!isRecord(body)) return false;
  if (body.mode !== 'reading' && body.mode !== 'clarification') return false;
  if (typeof body.question !== 'string') return false;
  if (!isRecord(body.spread)) return false;
  if (!Array.isArray(body.cards) || body.cards.length === 0) return false;
  if (body.mode === 'clarification' && !isRecord(body.reading)) return false;
  return true;
}

function getBody(body: unknown): unknown {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

// ── Retry-after parser ──────────────────────────────────────────
// Gemini 在 429 回應的 error.details 裡可能帶 retryDelay（秒數字串如 "58s"）
// 或在 error.message 裡帶類似 "retry after 58 seconds" 的文字。

function parseRetryAfterSeconds(detail: string): number | undefined {
  // 嘗試解析 "retryDelay":"58s" 格式
  const retryDelayMatch = detail.match(/"retryDelay"\s*:\s*"(\d+)s"/);
  if (retryDelayMatch) return parseInt(retryDelayMatch[1], 10);

  // 嘗試解析 "retry after N seconds" 或 "retry_after: N" 格式
  const retryTextMatch = detail.match(/retry[_ ]?after[:\s]+(\d+)/i);
  if (retryTextMatch) return parseInt(retryTextMatch[1], 10);

  return undefined;
}

// ── Core Gemini caller with model fallback ──────────────────────

interface GeminiCallOptions {
  responseMimeType?: string;
  responseSchema?: object;
  temperature: number;
}

interface GeminiCallResult {
  text: string;
  model: GeminiModel;
}

/** 可 fallback 的狀態碼：quota 用完或服務暫時不可用 */
function isFallbackableStatus(status: number): boolean {
  return status === 429 || status === 503;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 每輪掃過所有模型；全部暫時失敗才退避後重試，避免免費層偶發 429/503 直接放棄。
const MAX_ROUNDS = 3;
const BACKOFF_BASE_MS = [1200, 2500] as const;
const BACKOFF_CAP_MS = 6000;
// 429 的 retryDelay 超過此秒數，視為硬性額度用盡，不空等（會燒掉函式預算）。
const HARD_QUOTA_THRESHOLD_S = 6;

/**
 * 計算下一輪重試前的等待毫秒數。
 * 回傳 null = 不該再等（硬性額度用盡），呼叫端應直接放棄。
 */
function computeBackoff(
  round: number,
  lastStatus: number,
  lastRetryAfter: number | undefined,
): number | null {
  if (lastStatus === 429 && typeof lastRetryAfter === 'number') {
    if (lastRetryAfter > HARD_QUOTA_THRESHOLD_S) return null;
  }
  const base = BACKOFF_BASE_MS[round] ?? 4000;
  const fromRetryAfter =
    typeof lastRetryAfter === 'number' && lastRetryAfter <= HARD_QUOTA_THRESHOLD_S
      ? lastRetryAfter * 1000
      : 0;
  return Math.min(Math.max(base, fromRetryAfter), BACKOFF_CAP_MS);
}

async function callGeminiWithFallback(
  apiKey: string,
  prompt: string,
  config: GeminiCallOptions,
): Promise<GeminiCallResult> {
  const generationConfig: Record<string, unknown> = {
    temperature: config.temperature,
    // 關閉 2.5 Flash 預設的思考模式，省去推理延遲，大幅加快回應速度。
    thinkingConfig: { thinkingBudget: 0 },
  };
  if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
  if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;

  const requestBody = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig,
  });

  let lastStatus = 503;
  let lastDetail = '';
  let lastRetryAfter: number | undefined;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) {
          console.log(`[gemini] success with model=${model} round=${round}`);
          return { text, model };
        }
        // 空內容：視為暫時性，記為可重試後換下一個模型 / 下一輪
        lastStatus = 503;
        lastDetail = 'Gemini returned empty content';
        lastRetryAfter = undefined;
        console.warn(`[gemini] model=${model} round=${round} empty content, retrying`);
        continue;
      }

      const detail = await res.text().catch(() => '');
      lastStatus = res.status;
      lastDetail = detail;
      lastRetryAfter = parseRetryAfterSeconds(detail);

      console.warn(`[gemini] model=${model} round=${round} status=${res.status}`);

      // 非 fallbackable 錯誤（400、401、403 等）：直接拋出，不繼續嘗試
      if (!isFallbackableStatus(res.status)) {
        throw Object.assign(
          new Error(`Gemini API error ${res.status}: ${detail}`),
          { status: res.status, detail },
        );
      }

      // 是 429/503：繼續嘗試下一個模型（無需等待，下一個模型不共用 quota）
    }

    // 本輪所有模型都暫時失敗（429/503/空內容）。還有輪次才退避重試。
    if (round < MAX_ROUNDS - 1) {
      const waitMs = computeBackoff(round, lastStatus, lastRetryAfter);
      if (waitMs === null) {
        // 硬性額度用盡，再等也沒用，直接跳出回 429
        console.warn(`[gemini] hard quota (retryDelay=${lastRetryAfter}s), giving up early`);
        break;
      }
      console.warn(`[gemini] round=${round} exhausted, backoff ${waitMs}ms`);
      await sleep(waitMs);
    }
  }

  // 所有輪次都失敗
  const err = Object.assign(
    new Error(`All Gemini attempts exhausted. Last status: ${lastStatus}`),
    { status: lastStatus, detail: lastDetail, retryAfterSeconds: lastRetryAfter },
  );
  throw err;
}

// ── Vercel handler ──────────────────────────────────────────────

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'Gemini API key is not configured' });
  }

  const body = getBody(request.body);
  if (!isValidBody(body)) {
    return response.status(400).json({ error: 'Invalid request body' });
  }

  try {
    if (body.mode === 'reading') {
      const prompt = buildReadingPrompt(body.question, body.cards, body.spread);
      const { text, model } = await callGeminiWithFallback(apiKey, prompt, {
        responseMimeType: 'application/json',
        responseSchema: readingResponseSchema(body.cards.length),
        temperature: 0.7,
      });
      return response.status(200).json({ ...JSON.parse(text), model });
    }

    // mode === 'clarification'
    const prompt = buildClarificationPrompt(body.question, body.cards, body.spread, body.reading);
    const { text, model } = await callGeminiWithFallback(apiKey, prompt, { temperature: 0.65 });
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Gemini returned empty clarification');
    return response.status(200).json({ clarification: trimmed, model });
  } catch (error) {
    console.error('[gemini] handler error:', error);

    // 判斷是否為 429 / 503（所有模型都用盡）
    const errObj = error as { status?: number; retryAfterSeconds?: number };
    const status = typeof errObj.status === 'number' ? errObj.status : 500;

    if (status === 429) {
      const payload: Record<string, unknown> = {
        error: 'AI 解牌額度暫時用完，請稍後再試。',
        status: 429,
        retryable: true,
      };
      if (typeof errObj.retryAfterSeconds === 'number') {
        payload.retryAfterSeconds = errObj.retryAfterSeconds;
      }
      return response.status(429).json(payload);
    }

    if (status === 503) {
      return response.status(503).json({
        error: 'AI 解牌服務暫時繁忙，請稍後再試。',
        status: 503,
        retryable: true,
      });
    }

    // 其他錯誤（400、401、403、500 …）
    const message = error instanceof Error ? error.message : String(error);
    return response.status(status === 400 || status === 401 || status === 403 ? status : 500).json({
      error: `解牌時發生錯誤，請稍後再試。`,
      status,
      detail: message,
      retryable: false,
    });
  }
}
