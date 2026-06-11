import { GoogleGenAI, Type, type Schema } from '@google/genai';
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

const readingResponseSchema = (cardCount: number): Schema => ({
  type: Type.OBJECT,
  properties: {
    interpretations: {
      type: Type.ARRAY,
      description: `相容欄位，必須剛好包含 ${cardCount} 個字串元素；每個元素只需簡短概括單張牌在牌陣中的作用。`,
      items: {
        type: Type.STRING,
      },
    },
    summary: {
      type: Type.STRING,
      description: '針對使用者問題、牌陣位置與全部抽牌的主要整體解簽。',
    },
    actions: {
      type: Type.ARRAY,
      description: '剛好 3 個具體、可在 24-72 小時內執行的行動。',
      items: {
        type: Type.STRING,
      },
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

  const ai = new GoogleGenAI({ apiKey });

  try {
    if (body.mode === 'reading') {
      const prompt = buildReadingPrompt(body.question, body.cards, body.spread);
      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: readingResponseSchema(body.cards.length),
          temperature: 0.7,
        },
      });

      const text = geminiResponse.text;
      if (!text) {
        throw new Error('Gemini returned an empty reading response');
      }

      return response.status(200).json(JSON.parse(text));
    }

    const prompt = buildClarificationPrompt(body.question, body.cards, body.spread, body.reading);
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.65,
      },
    });

    const clarification = geminiResponse.text?.trim();
    if (!clarification) {
      throw new Error('Gemini returned an empty clarification response');
    }

    return response.status(200).json({ clarification });
  } catch (error) {
    console.error('Gemini proxy failed:', error);
    return response.status(502).json({ error: 'Gemini request failed' });
  }
}
