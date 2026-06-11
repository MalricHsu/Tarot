import type { DrawnCard, ReadingResult, SpreadDefinition } from '../types';

// 前端只負責呼叫 /api/gemini 代理；實際的 oracle / clarification prompt
// 定義在 api/gemini.ts（伺服器端），避免重複維護兩份 prompt。

// ── 友善錯誤訊息 ───────────────────────────────────────────────
// 根據後端回傳的 status 碼轉換成使用者可讀的文字。

export interface GeminiApiError extends Error {
  /** HTTP status from /api/gemini */
  httpStatus: number;
  /** 使用者可直接顯示的訊息 */
  userMessage: string;
  /** 可重試 */
  retryable: boolean;
  /** 建議重試等待秒數（若後端有提供） */
  retryAfterSeconds?: number;
}

function makeGeminiError(
  httpStatus: number,
  serverMessage: string,
  retryable: boolean,
  retryAfterSeconds?: number,
): GeminiApiError {
  let userMessage: string;
  if (httpStatus === 429) {
    userMessage = '今日 AI 解牌能量暫時用完，請稍後再試。';
  } else if (httpStatus === 503) {
    userMessage = 'AI 解牌服務暫時繁忙，請稍後再試。';
  } else {
    userMessage = '解牌時發生錯誤，請稍後再試。';
  }

  const err = new Error(serverMessage) as GeminiApiError;
  err.name = 'GeminiApiError';
  err.httpStatus = httpStatus;
  err.userMessage = userMessage;
  err.retryable = retryable;
  if (retryAfterSeconds !== undefined) err.retryAfterSeconds = retryAfterSeconds;
  return err;
}

// ── Request helper ─────────────────────────────────────────────

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

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 後端已對 429/503 做重試；前端再加一層保險，吸收網路抖動與偶發 503。
const CLIENT_MAX_RETRIES = 2;
const CLIENT_RETRY_DELAYS_MS = [1500, 3000] as const;

async function requestGeminiOnce<T>(payload: GeminiRequestPayload): Promise<T> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const data = (await response.json()) as T & { model?: string };
    // 開發除錯：顯示實際使用的模型
    if (data.model) {
      console.log(`[gemini] response model: ${data.model}`);
    }
    return data;
  }

  // 解析後端結構化錯誤
  let serverError = '';
  let retryable = false;
  let retryAfterSeconds: number | undefined;
  try {
    const errData = (await response.json()) as {
      error?: string;
      retryable?: boolean;
      retryAfterSeconds?: number;
    };
    serverError = errData.error ?? `HTTP ${response.status}`;
    retryable = errData.retryable ?? false;
    retryAfterSeconds = errData.retryAfterSeconds;
  } catch {
    serverError = `HTTP ${response.status}`;
  }

  throw makeGeminiError(response.status, serverError, retryable, retryAfterSeconds);
}

/** 是否值得前端自動重試：網路錯誤，或可重試的 503（429 硬額度不重試）。 */
function shouldClientRetry(error: unknown): boolean {
  if (!isGeminiApiError(error)) return true; // fetch 本身拋錯（網路斷）→ 重試
  if (error.httpStatus === 503 && error.retryable) return true;
  return false;
}

async function requestGemini<T>(payload: GeminiRequestPayload): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= CLIENT_MAX_RETRIES; attempt += 1) {
    try {
      return await requestGeminiOnce<T>(payload);
    } catch (error) {
      lastError = error;
      if (attempt >= CLIENT_MAX_RETRIES || !shouldClientRetry(error)) break;
      console.warn(`[gemini] client retry ${attempt + 1}/${CLIENT_MAX_RETRIES}`);
      await sleep(CLIENT_RETRY_DELAYS_MS[attempt] ?? 3000);
    }
  }
  throw lastError;
}

// ── Public API ─────────────────────────────────────────────────

export async function generateReading(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition,
): Promise<Omit<ReadingResult, 'cards'>> {
  const result = await requestGemini<Omit<ReadingResult, 'cards'>>(
    { mode: 'reading', question, cards, spread },
  );

  if (
    !Array.isArray(result.interpretations) ||
    typeof result.summary !== 'string' ||
    !Array.isArray(result.actions)
  ) {
    throw new Error('Gemini 回傳格式不正確');
  }

  return {
    interpretations: result.interpretations,
    summary: result.summary,
    actions: result.actions.filter((item): item is string => typeof item === 'string').slice(0, 3),
  };
}

export async function generateClarification(
  question: string,
  cards: DrawnCard[],
  spread: SpreadDefinition,
  reading: Omit<ReadingResult, 'cards'>,
): Promise<string> {
  const result = await requestGemini<{ clarification: string }>(
    { mode: 'clarification', question, cards, spread, reading },
  );

  if (typeof result.clarification !== 'string' || result.clarification.trim().length === 0) {
    throw new Error('Gemini API 沒有回傳解惑內容');
  }

  return result.clarification.trim();
}

/** 判斷 error 是否為 GeminiApiError */
export function isGeminiApiError(error: unknown): error is GeminiApiError {
  return (
    error instanceof Error &&
    (error as GeminiApiError).name === 'GeminiApiError'
  );
}
