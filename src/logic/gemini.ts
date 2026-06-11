import type { DrawnCard, ReadingResult, SpreadDefinition } from '../types';

// 前端只負責呼叫 /api/gemini 代理；實際的 oracle / clarification prompt
// 定義在 api/gemini.ts（伺服器端），避免重複維護兩份 prompt。

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
    let errorDetail = '';
    try {
      const data = (await response.json()) as { error?: unknown };
      if (typeof data.error === 'string') {
        errorDetail = `: ${data.error}`;
      }
    } catch {
      errorDetail = '';
    }

    throw new Error(`Gemini proxy request failed: ${response.status}${errorDetail}`);
  }

  return (await response.json()) as T;
}
