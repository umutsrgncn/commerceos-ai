import type { Content } from "@google/generative-ai";

import { generateWithRetry, plannerModel } from "./gemini";

/**
 * Context çok büyüdüğünde — ayrı bir Gemini call ile geçmişi 9 başlık altında özetle.
 * Çıktı, history'yi yeniden başlatmak için kullanılır.
 */

const COMPACT_PROMPT = `Görevin: aşağıdaki sohbet geçmişinden, görevi DEVAM ettirebilecek özlü ama TEKNİK olarak eksiksiz bir özet çıkarmak. TOOL ÇAĞIRMA — sadece metin döndür.

JSON çıktı (başka şey yazma):

{
  "primary_intent": "Kullanıcının asıl talebi (1-2 cümle)",
  "decisions": ["Önemli teknik karar 1", "..."],
  "files_touched": [
    { "path": "...", "what": "ne yapıldı (örn. yazıldı, edit'lendi, okundu)" }
  ],
  "errors_and_fixes": [
    { "error": "...", "fix": "..." }
  ],
  "pending_steps": ["Yapılması gereken kalan adım", "..."],
  "current_position": "şu an tam olarak ne yapıyorduk — net 1-2 cümle, en son tool çağrısı dahil"
}

Eğer bilmiyorsan boş array ya da "" döndür. UYDURMA. Sadece geçmişte gerçekten geçenleri yaz.`;

export type CompactSummary = {
  primary_intent: string;
  decisions: string[];
  files_touched: Array<{ path: string; what: string }>;
  errors_and_fixes: Array<{ error: string; fix: string }>;
  pending_steps: string[];
  current_position: string;
};

/**
 * History'i compact et — özet metni döner.
 * Çağıran taraf history'i restart eder: [prefix, summaryUser, ackModel, lastTurns].
 */
export async function compactHistory(history: Content[]): Promise<CompactSummary | null> {
  // History'i text'e flatten et
  const transcript = history
    .map((m) => {
      const parts: string[] = [];
      for (const p of m.parts ?? []) {
        if ("text" in p && p.text) parts.push(p.text);
        if ("functionCall" in p && p.functionCall) {
          const fc = p.functionCall;
          parts.push(`[TOOL: ${fc.name} ${JSON.stringify(fc.args).slice(0, 200)}]`);
        }
        if ("functionResponse" in p && p.functionResponse) {
          const fr = p.functionResponse;
          const respStr = JSON.stringify(fr.response).slice(0, 400);
          parts.push(`[RESULT(${fr.name}): ${respStr}]`);
        }
      }
      return `## ${m.role.toUpperCase()}\n${parts.join("\n")}`;
    })
    .join("\n\n")
    .slice(0, 60_000); // güvenlik cap

  const planner = plannerModel();
  try {
    const res = await generateWithRetry(
      planner,
      `${COMPACT_PROMPT}\n\n────────────────────────────────────────\nSOHBET GEÇMİŞİ:\n────────────────────────────────────────\n${transcript}`,
      { maxRetries: 2 },
    );
    const text = res.response.text();
    const cleaned = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned) as CompactSummary;
  } catch {
    return null;
  }
}

/**
 * Compact summary'i agent'a model-friendly bir text mesaja çevir.
 */
export function summaryToText(s: CompactSummary): string {
  const lines: string[] = [];
  lines.push("=== ÖNCEKİ GEÇMİŞ (COMPACTED) ===");
  lines.push(`\n# Asıl Talep\n${s.primary_intent}`);
  if (s.decisions.length > 0) {
    lines.push("\n# Verilen Kararlar");
    for (const d of s.decisions) lines.push(`- ${d}`);
  }
  if (s.files_touched.length > 0) {
    lines.push("\n# Dokunulan Dosyalar");
    for (const f of s.files_touched) lines.push(`- ${f.path} → ${f.what}`);
  }
  if (s.errors_and_fixes.length > 0) {
    lines.push("\n# Karşılaşılan Hatalar ve Çözümler");
    for (const e of s.errors_and_fixes) lines.push(`- HATA: ${e.error}\n  ÇÖZÜM: ${e.fix}`);
  }
  if (s.pending_steps.length > 0) {
    lines.push("\n# Kalan Adımlar");
    for (const p of s.pending_steps) lines.push(`- ${p}`);
  }
  lines.push(`\n# Şu Anki Konum\n${s.current_position}`);
  lines.push("\n=== ÖZET SONU — buradan devam et ===");
  return lines.join("\n");
}
