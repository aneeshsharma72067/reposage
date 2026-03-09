import { GoogleGenAI } from '@google/genai';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function resolveGeminiModel(): string {
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  return configuredModel && configuredModel.length > 0
    ? configuredModel
    : DEFAULT_GEMINI_MODEL;
}

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing required environment variable: GEMINI_API_KEY');
  }
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: resolveGeminiModel(),
    contents: prompt,
  });

  const responseText = response.text;

  if (!responseText || responseText.trim().length === 0) {
    throw new Error('Gemini returned an empty response');
  }

  return responseText;
}

