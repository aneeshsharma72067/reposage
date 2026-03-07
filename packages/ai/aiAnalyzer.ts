import { callGemini } from './geminiClient';
import { buildCommitPrompt } from './prompts/commitAnalysisPrompt';
import type { AnalysisContext, AIFinding } from './types';

type ParsedGeminiResponse = {
  findings?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSeverity(value: unknown): AIFinding['severity'] | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized === 'INFO' ||
    normalized === 'WARNING' ||
    normalized === 'CRITICAL'
  ) {
    return normalized;
  }

  return null;
}

function parseJsonFromText(rawText: string): ParsedGeminiResponse | null {
  try {
    return JSON.parse(rawText) as ParsedGeminiResponse;
  } catch {
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    const candidate = rawText.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(candidate) as ParsedGeminiResponse;
    } catch {
      return null;
    }
  }
}

function parseFindings(parsed: ParsedGeminiResponse | null): AIFinding[] {
  if (!parsed || !Array.isArray(parsed.findings)) {
    return [];
  }

  const findings: AIFinding[] = [];

  for (const item of parsed.findings) {
    if (!isObject(item)) {
      continue;
    }

    const severity = normalizeSeverity(item.severity);
    const type = typeof item.type === 'string' ? item.type.trim() : '';
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const description =
      typeof item.description === 'string' ? item.description.trim() : '';
    const file = typeof item.file === 'string' ? item.file.trim() : undefined;

    if (!severity || !type || !title || !description) {
      continue;
    }

    findings.push({
      type,
      severity,
      title,
      description,
      file,
    });
  }

  return findings;
}

export async function analyzeWithAI(
  context: AnalysisContext,
): Promise<AIFinding[]> {
  try {
    const prompt = buildCommitPrompt(context);
    const rawResponse = await callGemini(prompt);
    const parsed = parseJsonFromText(rawResponse);

    return parseFindings(parsed);
  } catch {
    return [];
  }
}

