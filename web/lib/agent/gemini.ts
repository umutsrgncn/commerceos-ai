import {
  GoogleGenerativeAI,
  type FunctionDeclaration,
  type GenerativeModel,
  type Tool,
} from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  // worker boot'unda fail-fast vermeyi tercih ederiz
  // (lazy import edildiğinde de uyarı)
  // eslint-disable-next-line no-console
  console.warn("[agent/gemini] GEMINI_API_KEY env yok — agent çalışmaz");
}

const genAI = new GoogleGenerativeAI(API_KEY ?? "missing-key");

export function plannerModel(): GenerativeModel {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_PLANNER_MODEL ?? "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });
}

export function agentModel(tools: FunctionDeclaration[]): GenerativeModel {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_AGENT_MODEL ?? "gemini-2.0-flash-exp",
    tools: [{ functionDeclarations: tools }] as Tool[],
    generationConfig: {
      temperature: 0.4,
    },
  });
}
