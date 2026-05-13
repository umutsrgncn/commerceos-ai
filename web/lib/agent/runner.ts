import type { Content, FunctionCall, Part } from "@google/generative-ai";

import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import { agentModel, plannerModel } from "./gemini";
import { buildAgentTurnPrompt, buildPlannerPrompt, SYSTEM_PROMPT } from "./prompts";
import { startPreview, stopPreview } from "./preview";
import { buildScopeBriefing, getScopesByIds, type AgentScope } from "./scopes";
import { resetTestData } from "./test-db";
import { execTool, TOOL_DECLS, type AgentContext } from "./tools";
import { filterAgentRelevantErrors, runTsc } from "./tsc-gate";
import { commitWorktree, createWorktree, destroyWorktree, type Worktree } from "./worktree";

const MAX_ITERATIONS = 25;
const MAX_TSC_RETRIES = 5;

class CancelledError extends Error {
  constructor() {
    super("cancelled");
  }
}

async function isCancelled(taskId: string): Promise<boolean> {
  const row = await db.agentTask.findUnique({
    where: { id: taskId },
    select: { cancelRequested: true },
  });
  return !!row?.cancelRequested;
}

async function ensureNotCancelled(taskId: string) {
  if (await isCancelled(taskId)) throw new CancelledError();
}

function makeCtx(taskId: string, wt: Worktree, scopes: AgentScope[]): AgentContext {
  return {
    taskId,
    worktreePath: wt.path,
    scopes,
    emit: async (type, summary, payload) => {
      await emitAgentEvent({ taskId, type, summary, payload: payload ?? undefined });
    },
  };
}

/**
 * Tek bir task'ı baştan sona çalıştır. Worker tarafından çağrılır.
 * Mutex (tek-aynı-anda) ve claim worker'da yapılır.
 */
export async function runTask(taskId: string): Promise<void> {
  const task = await db.agentTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error(`Task bulunamadı: ${taskId}`);

  let wt: Worktree | null = null;
  let finalSummary: string | null = null;

  try {
    // ─── 1) Worktree hazırla ───
    await emitAgentEvent({ taskId, type: "STATUS", summary: "Worktree hazırlanıyor…" });
    wt = await createWorktree(taskId, task.title);
    await db.agentTask.update({
      where: { id: taskId },
      data: { branchName: wt.branch, worktreePath: wt.path },
    });
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: `Branch hazır: ${wt.branch}`,
      payload: { branch: wt.branch },
    });

    await ensureNotCancelled(taskId);

    // ─── 2) Planlama (triage + scope seçimi) ───
    await db.agentTask.update({ where: { id: taskId }, data: { status: "PLANNING" } });
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: "Planlama: kod keşfi + sayfa seçimi yapılıyor…",
    });

    const planner = plannerModel();
    const planRes = await planner.generateContent(
      buildPlannerPrompt({ title: task.title, prompt: task.prompt }),
    );
    const planText = planRes.response.text();
    let plan: Record<string, unknown> = {};
    try {
      plan = JSON.parse(planText);
    } catch {
      plan = {
        summary: "Plan JSON parse edilemedi",
        feasible: false,
        reason_if_not_feasible: "Planner geçersiz JSON döndürdü.",
        raw: planText.slice(0, 500),
      };
    }

    // Plan içinden agent scope'larını çek
    const chosenScopeIds = Array.isArray(plan.selected_scopes)
      ? (plan.selected_scopes as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const scopes = getScopesByIds(chosenScopeIds);

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        planJson: plan as never,
        targetScopes: chosenScopeIds.length > 0 ? chosenScopeIds : [],
      },
    });

    const planSummary = (plan.summary as string | undefined) ?? "Plan hazır";
    const kind = (plan.kind as string | undefined) ?? "ui";
    await emitAgentEvent({
      taskId,
      type: "THINK",
      summary: planSummary,
      payload: {
        feasible: plan.feasible,
        kind,
        steps: Array.isArray(plan.steps) ? (plan.steps as string[]).length : 0,
        scopes: chosenScopeIds.length,
      },
    });

    if (plan.feasible === false) {
      const reason = String(
        plan.reason_if_not_feasible ?? "Görev güvenlik/scope kurallarını ihlal ediyor.",
      );
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: `Güvenlik tedbiri devreye girdi: ${reason.slice(0, 200)}`,
        payload: { kind: "refusal", reason_kind: kind },
      });
      await db.agentTask.update({
        where: { id: taskId },
        data: {
          status: "REFUSED",
          errorMsg: reason,
          completedAt: new Date(),
        },
      });
      return;
    }

    if (scopes.length === 0) {
      const reason =
        "Planner bir scope seçemedi — talep katalogla eşleşmedi. Daha net yaz veya farklı bir görev iste.";
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: `Güvenlik tedbiri devreye girdi: ${reason}`,
        payload: { kind: "no_scope" },
      });
      await db.agentTask.update({
        where: { id: taskId },
        data: { status: "REFUSED", errorMsg: reason, completedAt: new Date() },
      });
      return;
    }

    await emitAgentEvent({
      taskId,
      type: "NOTE",
      summary: `AI ${scopes.length} sayfa seçti: ${scopes.map((s) => s.label).join(", ")}`,
      payload: { kind, scopes: chosenScopeIds },
    });

    await ensureNotCancelled(taskId);

    // ─── 3) Execution loop ───
    await db.agentTask.update({ where: { id: taskId }, data: { status: "RUNNING" } });
    await emitAgentEvent({ taskId, type: "STATUS", summary: "Kod değişiklikleri yapılıyor…" });

    const ctx = makeCtx(taskId, wt, scopes);
    const model = agentModel(TOOL_DECLS);

    // Conversation state
    const history: Content[] = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT(scopes) }] },
      {
        role: "model",
        parts: [{ text: "Anladım. Tool'ları kullanarak görevi tamamlayacağım." }],
      },
      { role: "user", parts: [{ text: buildAgentTurnPrompt({ plan, iteration: 1 }) }] },
    ];

    let iteration = 0;
    let finished = false;
    let totalTokens = 0;
    let tscRetries = 0;

    while (iteration < MAX_ITERATIONS && !finished) {
      iteration += 1;
      await ensureNotCancelled(taskId);

      const result = await model.generateContent({ contents: history });
      const usage = result.response.usageMetadata;
      if (usage?.totalTokenCount) totalTokens += usage.totalTokenCount;

      const candidate = result.response.candidates?.[0];
      if (!candidate) {
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary: "Model cevap döndürmedi — duruyorum",
        });
        throw new Error("no candidate from model");
      }

      const parts: Part[] = candidate.content?.parts ?? [];
      history.push({ role: "model", parts });

      const functionCalls: FunctionCall[] = parts
        .filter((p): p is Part & { functionCall: FunctionCall } => "functionCall" in p && !!p.functionCall)
        .map((p) => p.functionCall);

      // Eğer text varsa (think), emit et
      const textParts = parts.filter((p) => "text" in p && (p as { text: string }).text).map(
        (p) => (p as { text: string }).text,
      );
      const thinkText = textParts.join("\n").trim();
      if (thinkText) {
        await emitAgentEvent({
          taskId,
          type: "THINK",
          summary: thinkText.slice(0, 400),
        });
      }

      if (functionCalls.length === 0) {
        // Tool call yok ama text de yok ise loop biter
        if (!thinkText) {
          await emitAgentEvent({
            taskId,
            type: "NOTE",
            summary: "Model boş cevap döndü — duruyorum.",
          });
          break;
        }
        // Text var ama call yok — model'i tekrar dürtelim
        history.push({
          role: "user",
          parts: [
            {
              text: "Tool çağırmadın. Lütfen bir tool çağır veya finish'le bitir.",
            },
          ],
        });
        continue;
      }

      // Tool'ları çalıştır
      const responseParts: Part[] = [];
      for (const call of functionCalls) {
        await emitAgentEvent({
          taskId,
          type: "TOOL_CALL",
          summary: `${call.name}(${summarizeArgs(call.args)})`,
          payload: { tool: call.name, args: argsHints(call.args) },
        });

        const out = await execTool(ctx, call.name, (call.args ?? {}) as Record<string, unknown>);

        if (out.finish) {
          // ── tsc gate ── finish öncesi TypeScript doğrulaması
          await emitAgentEvent({
            taskId,
            type: "STATUS",
            summary: "Finish öncesi TypeScript kontrolü…",
          });
          const tscResult = await runTsc(wt.webPath);
          if (tscResult.ok) {
            finished = true;
            finalSummary = out.finish.summary;
            await emitAgentEvent({
              taskId,
              type: "NOTE",
              summary: `Bitti: ${finalSummary} (tsc temiz)`,
              payload: { summary: finalSummary, tsc: "clean" },
            });
            break;
          }
          // tsc fail → agent'a hataları geri besle
          tscRetries += 1;
          const relevantErrors = filterAgentRelevantErrors(tscResult.errors);
          const errBody = (relevantErrors || tscResult.errors).slice(0, 3500);

          if (tscRetries >= MAX_TSC_RETRIES) {
            await emitAgentEvent({
              taskId,
              type: "ERROR",
              summary: `Max ${MAX_TSC_RETRIES} tsc denemesi doldu — kabul ediliyor, kullanıcı önizlemede görsün.`,
              payload: { tsc: "max-retries", errorCount: tscResult.errorCount },
            });
            // tsc temizlenemedi ama agent'ı sonsuza dek tıkamayalım — finish'i kabul et
            finished = true;
            finalSummary = out.finish.summary;
            break;
          }

          await emitAgentEvent({
            taskId,
            type: "ERROR",
            summary: `TypeScript hatası (${tscResult.errorCount}) — finish geri alındı, deneme ${tscRetries}/${MAX_TSC_RETRIES}.`,
            payload: { tsc: "fail", errorCount: tscResult.errorCount, retry: tscRetries },
          });
          responseParts.push({
            functionResponse: {
              name: "finish",
              response: {
                ok: false,
                error: `Finish reddedildi: TypeScript hataları var. Bu hataları düzelt, sonra finish'i tekrar çağır.\n\n${errBody}`,
              },
            },
          });
          // finished = false bırak — döngü devam etsin
          continue;
        }

        if (out.ok) {
          await emitAgentEvent({
            taskId,
            type: "TOOL_RESULT",
            summary: `${call.name} OK`,
            payload: summarizeResult(call.name, out.result),
          });
          responseParts.push({
            functionResponse: {
              name: call.name,
              response: { ok: true, result: clampResult(out.result) },
            },
          });
        } else {
          await emitAgentEvent({
            taskId,
            type: "ERROR",
            summary: `${call.name} hata: ${out.error}`,
            payload: { tool: call.name, error: out.error },
          });
          responseParts.push({
            functionResponse: {
              name: call.name,
              response: { ok: false, error: out.error },
            },
          });
        }
      }

      if (finished) break;
      if (responseParts.length) {
        history.push({ role: "user", parts: responseParts });
      }
    }

    if (!finished) {
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: `Max iterasyon (${MAX_ITERATIONS}) doldu, devam edilmiyor.`,
      });
    }

    await ensureNotCancelled(taskId);

    // ─── 4) Commit (varsa) ───
    const commit = await commitWorktree(wt, `agent: ${task.title}`, {
      name: "agent",
      email: "agent@commerceos.local",
    });
    if (commit.ok) {
      await emitAgentEvent({
        taskId,
        type: "COMMIT",
        summary: `Commit atıldı (${commit.filesChanged} dosya): ${commit.sha.slice(0, 8)}`,
        payload: { sha: commit.sha, files: commit.filesChanged },
      });
    } else {
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: commit.reason,
      });
    }

    // ─── 5) Test DB'yi taze veriye sıfırla ───
    if (commit.ok) {
      await emitAgentEvent({
        taskId,
        type: "STATUS",
        summary: "Test veritabanı taze veriyle hazırlanıyor (canlı veri izole)…",
      });
      try {
        await resetTestData();
        await emitAgentEvent({
          taskId,
          type: "NOTE",
          summary: "Test schema hazır — önizleme commerceos_test üzerinde çalışacak.",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary: `Test DB hazırlanamadı: ${msg.slice(0, 200)} — önizleme yine de açılacak ama canlı DB'ye yazar.`,
        });
      }
    }

    // ─── 6) Önizleme aç (worktree dev + cloudflared tunnel) ───
    if (commit.ok) {
      try {
        const { port, tunnelUrl } = await startPreview({ taskId, wt });
        await db.agentTask.update({
          where: { id: taskId },
          data: { port, tunnelUrl: tunnelUrl ?? null },
        });
      } catch (previewErr) {
        const msg = previewErr instanceof Error ? previewErr.message : String(previewErr);
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary: `Önizleme başlatılamadı: ${msg.slice(0, 200)}`,
        });
      }
    } else {
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: "Değişiklik yok — önizleme açılmadı.",
      });
    }

    // ─── 7) REVIEW status'una geç ───
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: "REVIEW",
        iterations: iteration,
        tokensUsed: totalTokens,
      },
    });
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: "Onay bekleniyor. Önizleme linkinden test edebilirsin.",
      payload: { iterations: iteration, tokens: totalTokens },
    });
  } catch (err) {
    if (err instanceof CancelledError) {
      await emitAgentEvent({
        taskId,
        type: "STATUS",
        summary: "Durdurma istenmişti — agent çıkıyor.",
      });
      // Preview + worktree temizle
      await stopPreview(taskId, "task iptal edildi");
      if (wt) await destroyWorktree(taskId, wt.branch);
      await db.agentTask.update({
        where: { id: taskId },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
          cancelRequested: false,
        },
      });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    await emitAgentEvent({
      taskId,
      type: "ERROR",
      summary: `Beklenmeyen hata: ${msg.slice(0, 300)}`,
    });
    await db.agentTask.update({
      where: { id: taskId },
      data: { status: "FAILED", errorMsg: msg, completedAt: new Date() },
    });
  }
}

// ─── Helpers ───

function summarizeArgs(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const obj = args as Record<string, unknown>;
  if (typeof obj.path === "string") return String(obj.path);
  if (typeof obj.pattern === "string") return String(obj.pattern).slice(0, 50);
  if (typeof obj.summary === "string") return `"${String(obj.summary).slice(0, 40)}…"`;
  return "";
}

function argsHints(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== "object") return {};
  const obj = args as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "content" || k === "new_string" || k === "old_string") {
      const s = String(v);
      out[`${k}_bytes`] = Buffer.byteLength(s, "utf8");
    } else if (typeof v === "string") {
      out[k] = v.slice(0, 100);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function summarizeResult(tool: string, result: unknown): Record<string, unknown> {
  if (!result || typeof result !== "object") return { tool };
  const r = result as Record<string, unknown>;
  if (tool === "read_file" && typeof r.content === "string") {
    return {
      path: r.path,
      bytes: Buffer.byteLength(r.content, "utf8"),
      truncated: r.truncated,
    };
  }
  if (tool === "grep") return { hits: r.hits };
  if (tool === "list_dir" && Array.isArray(r)) return { entries: r.length };
  return r as Record<string, unknown>;
}

function clampResult(result: unknown): unknown {
  // Modelin alacağı functionResponse — content çok büyükse kısalt
  if (!result) return result;
  if (typeof result === "object" && result !== null && "content" in result) {
    const r = result as { content: string; [k: string]: unknown };
    if (typeof r.content === "string" && r.content.length > 60_000) {
      return { ...r, content: r.content.slice(0, 60_000), truncated: true };
    }
  }
  return result;
}
