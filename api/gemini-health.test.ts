import { afterEach, describe, expect, it } from 'vitest';
import handler from './gemini-health';

interface MockResponse {
  headers: Record<string, string>;
  statusCode?: number;
  body?: unknown;
  status: (statusCode: number) => MockResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

const originalGeminiApiKey = process.env.GEMINI_API_KEY;

function createResponse(): MockResponse {
  const response: MockResponse = {
    headers: {},
    status(statusCode) {
      response.statusCode = statusCode;
      return response;
    },
    json(body) {
      response.body = body;
    },
    setHeader(name, value) {
      response.headers[name] = value;
    },
  };

  return response;
}

describe('GET /api/gemini-health', () => {
  afterEach(() => {
    if (originalGeminiApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiApiKey;
    }
  });

  it('returns configured true when GEMINI_API_KEY exists', () => {
    process.env.GEMINI_API_KEY = 'test-secret-key';
    const response = createResponse();

    handler({ method: 'GET' }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ configured: true });
    expect(JSON.stringify(response.body)).not.toContain('test-secret-key');
  });

  it('returns configured false when GEMINI_API_KEY is not set', () => {
    delete process.env.GEMINI_API_KEY;
    const response = createResponse();

    handler({ method: 'GET' }, response);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      configured: false,
      error: 'GEMINI_API_KEY is not configured',
    });
  });

  it('rejects non-GET requests', () => {
    process.env.GEMINI_API_KEY = 'test-secret-key';
    const response = createResponse();

    handler({ method: 'POST' }, response);

    expect(response.statusCode).toBe(405);
    expect(response.body).toEqual({ error: 'Method not allowed' });
    expect(JSON.stringify(response.body)).not.toContain('test-secret-key');
  });
});
