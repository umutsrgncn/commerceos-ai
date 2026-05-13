import {
  GoogleGenerativeAI,
  type FunctionDeclaration,
  type GenerativeModel,
  type Tool,
  type GenerateContentRequest,
  type GenerateContentResult,
} from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[agent/gemini] GEMINI_API_KEY env yok — agent çalışmaz");
}

const genAI = new GoogleGenerativeAI(API_KEY ?? "missing-key");

export function plannerModel(): GenerativeModel {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_PLANNER_MODEL ?? "gemini-2.5-pro",
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });
}

export function agentModel(tools: FunctionDeclaration[]): GenerativeModel {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_AGENT_MODEL ?? "gemini-2.5-flash",
    tools: [{ functionDeclarations: tools }] as Tool[],
    generationConfig: {
      temperature: 0.4,
    },
  });
}

/**
 * 429/503 hatalarında retry. Server'ın söylediği retryDelay'i respect eder.
 * Max 4 deneme, exponential backoff fallback.
 */
export async function generateWithRetry(
  model: GenerativeModel,
  req: GenerateContentRequest | string,
  opts: { maxRetries?: number; onRetry?: (info: { attempt: number; delayMs: number; reason: string }) => void } = {},
): Promise<GenerateContentResult> {
  const maxRetries = opts.maxRetries ?? 4;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(req as GenerateContentRequest);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retryable = isRetryable(msg);
      if (!retryable || attempt === maxRetries) throw err;

      const delayMs = parseRetryDelay(msg, attempt);
      opts.onRetry?.({ attempt, delayMs, reason: retryable });
      await sleep(delayMs);
    }
  }

  throw lastErr;
}

function isRetryable(msg: string): string | false {
  if (/\b429\b/.test(msg) || /Too Many Requests/i.test(msg) || /quota/i.test(msg)) return "rate-limit";
  if (/\b503\b/.test(msg) || /Service Unavailable/i.test(msg)) return "service-unavailable";
  if (/\b500\b/.test(msg) && /Internal/i.test(msg)) return "internal-error";
  if (/ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg)) return "network";
  return false;
}

function parseRetryDelay(msg: string, attempt: number): number {
  // Gemini "Please retry in 29.53s" formatı
  const m = msg.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (m) {
    return Math.min(Math.ceil(Number(m[1]) + 1) * 1000, 60_000);
  }
  // Fallback: exponential backoff (5s, 15s, 30s, 60s)
  return Math.min(5000 * Math.pow(2, attempt - 1), 60_000);
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
