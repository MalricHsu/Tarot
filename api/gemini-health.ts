interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return response.status(500).json({
      configured: false,
      error: 'GEMINI_API_KEY is not configured',
    });
  }

  return response.status(200).json({ configured: true });
}
