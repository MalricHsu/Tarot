import { buildClarificationPrompt, buildReadingPrompt } from '../src/logic/gemini';
import type { DrawnCard, ReadingResult, SpreadDefinition } from '../src/types';

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
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
      reading: Omit<ReadingResult, 'cards'>;
    };

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

async function callGemini(
  apiKey: string,
  prompt: string,
  config: {
    responseMimeType?: string;
    responseSchema?: object;
    temperature: number;
  },
): Promise<string> {
  const generationConfig: Record<string, unknown> = {
    temperature: config.temperature,
  };
  if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
  if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini REST API error ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty content');
  return text;
}

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
      const text = await callGemini(apiKey, prompt, {
        responseMimeType: 'application/json',
        responseSchema: readingResponseSchema(body.cards.length),
        temperature: 0.7,
      });
      return response.status(200).json(JSON.parse(text));
    }

    const prompt = buildClarificationPrompt(body.question, body.cards, body.spread, body.reading);
    const clarification = await callGemini(apiKey, prompt, { temperature: 0.65 });
    const trimmed = clarification.trim();
    if (!trimmed) throw new Error('Gemini returned empty clarification');
    return response.status(200).json({ clarification: trimmed });
  } catch (error) {
    console.error('Gemini proxy failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return response.status(502).json({ error: `Gemini request failed: ${message}` });
  }
}
