import type { Content, FunctionCall, Part } from "@google/generative-ai";

import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import { filterTestable, getChangedPages } from "./changed-pages";
import { compactHistory, summaryToText } from "./compact";
import { runDynamicE2e } from "./dynamic-e2e";
import { runE2eGate, summarizeE2eResult } from "./e2e-gate";
import { agentModel, generateWithRetry, plannerModel } from "./gemini";
import { buildAgentTurnPrompt, buildPlannerPrompt, SYSTEM_PROMPT } from "./prompts";
import { formatIssuesForAgent, lintChangedFiles } from "./rsc-lint";
import { startPreview, stopPreview } from "./preview";
import { buildScopeBriefing, getE2eSpecsForScopes, getScopesByIds, type AgentScope } from "./scopes";
import { resetTestData } from "./test-db";
import { execTool, makeReadFilesMap, TOOL_DECLS, type AgentContext } from "./tools";
import { filterAgentRelevantErrors, runTsc } from "./tsc-gate";
import { commitWorktree, createWorktree, destroyWorktree, type Worktree } from "./worktree";

const MAX_ITERATIONS = 25;
const MAX_TSC_RETRIES = 5;
/** Bir iterasyonda <500 token harcanırsa "ilerleme yok" sayılır. */
const DIMINISHING_TOKEN_DELTA = 500;
/** 3 iterasyon üst üste diminishing → otomatik finish. */
const MAX_DIMINISHING_STREAK = 3;
/** History'nin yaklaşık token sayısı bunu aşarsa LLM compact tetiklenir. */
const COMPACT_TRIGGER_TOKENS = 90_000;
const COMPACT_TARGET_HISTORY = 12; // compact sonrası kalan eleman sayısı

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
    readFiles: makeReadFilesMap(),
    editAttempts: new Map(),
    callCounter: { n: 0 },
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
    const isIteration = !!task.branchName;
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: isIteration
        ? `Önceki iterasyon devam ediyor — branch ${task.branchName} reuse ediliyor.`
        : "Worktree hazırlanıyor…",
    });
    wt = await createWorktree(taskId, task.title, {
      existingBranch: task.branchName ?? null,
    });
    await db.agentTask.update({
      where: { id: taskId },
      data: { branchName: wt.branch, worktreePath: wt.path },
    });
    if (!isIteration) {
      await emitAgentEvent({
        taskId,
        type: "STATUS",
        summary: `Branch hazır: ${wt.branch}`,
        payload: { branch: wt.branch },
      });
    }

    // Önceki feedback'leri topla (iterasyon için)
    const feedbackEvents = await db.agentEvent.findMany({
      where: {
        taskId,
        type: "NOTE",
      },
      orderBy: { seq: "asc" },
    });
    const feedbacks = feedbackEvents
      .filter((e) => {
        if (!e.payload || typeof e.payload !== "object") return false;
        const p = e.payload as { kind?: string };
        return p.kind === "user_feedback";
      })
      .map((e) => {
        const p = e.payload as { feedback?: string };
        return p.feedback ?? "";
      })
      .filter(Boolean);

    await ensureNotCancelled(taskId);

    // ─── 2) Planlama (triage + scope seçimi) ───
    await db.agentTask.update({ where: { id: taskId }, data: { status: "PLANNING" } });
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: "Planlama: kod keşfi + sayfa seçimi yapılıyor…",
    });

    // Feedback varsa, görev prompt'una ekle — planner bunu da kıymetlendirsin
    const promptWithFeedback =
      feedbacks.length > 0
        ? `${task.prompt}\n\n--- KULLANICI GERİ BİLDİRİMLERİ (sırasıyla) ---\n${feedbacks
            .map((f, i) => `${i + 1}. ${f}`)
            .join("\n")}\n\nMevcut çalışmayı geri bildirimlere göre revize et.`
        : task.prompt;

    const planner = plannerModel();
    const planRes = await generateWithRetry(
      planner,
      buildPlannerPrompt({ title: task.title, prompt: promptWithFeedback }),
      {
        onRetry: async ({ attempt, delayMs, reason }) => {
          await emitAgentEvent({
            taskId,
            type: "NOTE",
            summary: `Gemini ${reason} — ${Math.round(delayMs / 1000)}sn bekleyip yeniden deneme (${attempt}/4)…`,
          });
        },
      },
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

    // ── State (loop'a girmeden önce hepsini tanımla — TDZ önler) ──
    let iteration = 0;
    let finished = false;
    let totalTokens = 0;
    let tscRetries = 0;
    // Diminishing returns takibi — agent dönüp duruyorsa otomatik bitir
    let lastTotalTokens = 0;
    let diminishingStreak = 0;
    // Tool dedup — aynı read tool'unu 3. kez çağrıyorsa engel
    const callCounts = new Map<string, number>();
    const READ_TOOLS = new Set(["read_file", "list_dir", "grep"]);
    const callKey = (name: string, args: unknown): string => {
      if (!args || typeof args !== "object") return name;
      const a = args as Record<string, unknown>;
      const sig = a.path ?? a.pattern ?? JSON.stringify(a).slice(0, 100);
      return `${name}:${sig}`;
    };
    // Pre-read edilen dosyalar için sayacı 2 yap → 1 daha çağırırsa kabul, 2. denemede engel
    const seedPreReadCounts = (paths: string[]) => {
      for (const p of paths) callCounts.set(`read_file:${p}`, 2);
    };

    // Pre-read: planner'ın expected_files'ını agent görmeden önce oku
    // → grep/list_dir iterasyonları azalır, token tasarrufu
    const preReadFiles: Array<{ path: string; content: string; truncated: boolean }> = [];
    const expectedFiles = Array.isArray(plan.expected_files)
      ? (plan.expected_files as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 6)
      : [];
    if (expectedFiles.length > 0) {
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: `Pre-read: planner'ın işaret ettiği ${expectedFiles.length} dosya okunuyor…`,
        payload: { files: expectedFiles },
      });
      for (const rel of expectedFiles) {
        try {
          const r = await execTool(ctx, "read_file", { path: rel });
          if (r.ok && r.result && typeof r.result === "object" && "content" in r.result) {
            const v = r.result as { path: string; content: string; truncated: boolean };
            preReadFiles.push(v);
          }
        } catch {
          // Dosya yok ya da scope dışı — agent kendi keşfedecek
        }
      }
      seedPreReadCounts(preReadFiles.map((f) => f.path));
    }

    // Conversation state
    const preReadBlock =
      preReadFiles.length > 0
        ? `\n\nPlanner expected_files OKUNDU (bunları tekrar read_file ile çağırma):\n${preReadFiles
            .map(
              (f) =>
                `\n--- ${f.path} ${f.truncated ? "(truncated)" : ""} ---\n${f.content.slice(0, 8000)}`,
            )
            .join("\n")}`
        : "";
    const history: Content[] = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT(scopes) }] },
      {
        role: "model",
        parts: [{ text: "Anladım. Tool'ları kullanarak görevi tamamlayacağım." }],
      },
      {
        role: "user",
        parts: [{ text: buildAgentTurnPrompt({ plan, iteration: 1 }) + preReadBlock }],
      },
    ];

    while (iteration < MAX_ITERATIONS && !finished) {
      iteration += 1;
      await ensureNotCancelled(taskId);

      // LLM-based compact — token bütçesi sınırına yaklaştık mı?
      if (totalTokens > COMPACT_TRIGGER_TOKENS && history.length > COMPACT_TARGET_HISTORY) {
        await emitAgentEvent({
          taskId,
          type: "NOTE",
          summary: `Token bütçesi yüksek (${totalTokens}) — geçmiş özetlenip sıkıştırılıyor…`,
          payload: { tokens: totalTokens, historyLen: history.length },
        });
        const summary = await compactHistory(history);
        if (summary) {
          const summaryText = summaryToText(summary);
          // History'i restart et: prefix + summary + ack + son N turn
          const prefix = history.slice(0, HISTORY_PREFIX);
          const recent = history.slice(history.length - 6);
          history.length = 0;
          history.push(...prefix);
          history.push({ role: "user", parts: [{ text: summaryText }] });
          history.push({
            role: "model",
            parts: [{ text: "Özet alındı, kaldığım yerden devam ediyorum." }],
          });
          history.push(...recent);
          await emitAgentEvent({
            taskId,
            type: "NOTE",
            summary: `Compact tamam — history ${history.length} elemente düştü.`,
          });
        }
      }

      // History trimming — token tasarrufu için eski iter'leri özetle
      trimHistoryInPlace(history);

      const result = await generateWithRetry(
        model,
        { contents: history },
        {
          onRetry: async ({ attempt, delayMs, reason }) => {
            await emitAgentEvent({
              taskId,
              type: "NOTE",
              summary: `Gemini ${reason} — ${Math.round(delayMs / 1000)}sn bekleyip yeniden deneme (${attempt}/4)…`,
            });
          },
        },
      );
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
        // Dedup — aynı read'i 3. kez engelle
        if (READ_TOOLS.has(call.name)) {
          const key = callKey(call.name, call.args);
          const n = (callCounts.get(key) ?? 0) + 1;
          callCounts.set(key, n);
          if (n >= 3) {
            await emitAgentEvent({
              taskId,
              type: "NOTE",
              summary: `Aynı ${call.name} çağrısı 3. kez — agent başka yol denesin.`,
              payload: { tool: call.name, count: n },
            });
            responseParts.push({
              functionResponse: {
                name: call.name,
                response: {
                  ok: false,
                  error: `Bu çağrıyı (${key}) zaten yaptın. Sonuçları tekrar isteme — mevcut bilgiyle ilerle, farklı bir dosya/pattern dene, veya finish çağır.`,
                },
              },
            });
            continue;
          }
        }

        await emitAgentEvent({
          taskId,
          type: "TOOL_CALL",
          summary: `${call.name}(${summarizeArgs(call.args)})`,
          payload: { tool: call.name, args: argsHints(call.args) },
        });

        const out = await execTool(ctx, call.name, (call.args ?? {}) as Record<string, unknown>);

        if (out.finish) {
          // ── RSC lint (hızlı, deterministik) — server/client karıştırma
          const rscResult = await lintChangedFiles(wt.path);
          if (!rscResult.ok) {
            tscRetries += 1;
            const issuesText = formatIssuesForAgent(rscResult.issues);
            if (tscRetries >= MAX_TSC_RETRIES) {
              await emitAgentEvent({
                taskId,
                type: "ERROR",
                summary: `Max ${MAX_TSC_RETRIES} doğrulama denemesi doldu — kabul ediliyor.`,
                payload: { gate: "rsc", issues: rscResult.issues.length },
              });
              finished = true;
              finalSummary = out.finish.summary;
              break;
            }
            await emitAgentEvent({
              taskId,
              type: "ERROR",
              summary: `RSC kuralı ihlal edildi (${rscResult.issues.length}) — finish geri alındı, deneme ${tscRetries}/${MAX_TSC_RETRIES}.`,
              payload: { gate: "rsc", issues: rscResult.issues.length, retry: tscRetries },
            });
            responseParts.push({
              functionResponse: {
                name: "finish",
                response: {
                  ok: false,
                  error: `Finish reddedildi: Next.js RSC kurallarını ihlal ediyor.\n\n${issuesText}\n\nDosyaları düzelt, sonra finish'i tekrar çağır.`,
                },
              },
            });
            continue;
          }

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

      // Diminishing returns check — agent dönüp duruyor mu?
      const delta = totalTokens - lastTotalTokens;
      lastTotalTokens = totalTokens;
      if (iteration >= 3 && delta < DIMINISHING_TOKEN_DELTA) {
        diminishingStreak += 1;
        if (diminishingStreak >= MAX_DIMINISHING_STREAK) {
          await emitAgentEvent({
            taskId,
            type: "NOTE",
            summary: `${MAX_DIMINISHING_STREAK} iter üst üste <${DIMINISHING_TOKEN_DELTA} token harcandı — ilerleme yok, otomatik bitirme.`,
            payload: { iteration, diminishingStreak, delta },
          });
          finished = true;
          finalSummary =
            "Mevcut değişikliklerle bitirildi — agent yeni adım üretemiyordu.";
          break;
        }
      } else {
        diminishingStreak = 0;
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
    let previewPort: number | null = null;
    if (commit.ok) {
      try {
        const { port, tunnelUrl } = await startPreview({ taskId, wt });
        previewPort = port;
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

    // ─── 7) e2e test gate ───
    if (commit.ok && previewPort) {
      const specs = getE2eSpecsForScopes(scopes);
      if (specs.length > 0) {
        await db.agentTask.update({ where: { id: taskId }, data: { status: "TESTING" } });
        await emitAgentEvent({
          taskId,
          type: "STATUS",
          summary: `e2e testleri çalışıyor (${specs.length} spec)…`,
          payload: { specs },
        });
        try {
          const e2e = await runE2eGate({
            taskId,
            worktreePath: wt.path,
            webPath: wt.webPath,
            port: previewPort,
            specs,
          });
          await emitAgentEvent({
            taskId,
            type: "TEST_RUN",
            summary: summarizeE2eResult(e2e),
            payload: {
              passed: e2e.passed,
              failed: e2e.failed,
              skipped: e2e.skipped,
              total: e2e.total,
              durationMs: e2e.durationMs,
            },
          });
          if (e2e.screenshots.length > 0) {
            await emitAgentEvent({
              taskId,
              type: "SCREENSHOT",
              summary: `${e2e.screenshots.length} ekran görüntüsü alındı (scope spec'leri).`,
              payload: { count: e2e.screenshots.length, source: "scope" },
            });
          }
        } catch (testErr) {
          const msg = testErr instanceof Error ? testErr.message : String(testErr);
          await emitAgentEvent({
            taskId,
            type: "ERROR",
            summary: `e2e gate hatası: ${msg.slice(0, 200)}`,
          });
        }
      }

      // ─── 7b) Dinamik e2e — agent'ın değiştirdiği SAYFAlar için ───
      try {
        const allChanged = await getChangedPages(wt.path);
        const changedPages = filterTestable(allChanged);
        if (allChanged.length > 0) {
          await emitAgentEvent({
            taskId,
            type: "STATUS",
            summary: `Değişen ${allChanged.length} sayfa için anlık test + screenshot…`,
            payload: {
              pages: allChanged.map((p) => p.url),
              dynamicSkipped: allChanged.length - changedPages.length,
            },
          });
          if (changedPages.length > 0) {
            const dyn = await runDynamicE2e({
              taskId,
              port: previewPort,
              pages: changedPages,
            });
            await emitAgentEvent({
              taskId,
              type: "TEST_RUN",
              summary: `Dinamik: ${dyn.passed}/${dyn.total} sayfa OK${
                dyn.failed > 0 ? `, ${dyn.failed} başarısız` : ""
              }`,
              payload: dyn,
            });
            await emitAgentEvent({
              taskId,
              type: "SCREENSHOT",
              summary: `${dyn.pages.filter((p) => p.screenshotUrl).length} sayfa ekran görüntüsü alındı (değişiklik yapılanlar).`,
              payload: { count: dyn.pages.length, source: "dynamic" },
            });
          }
        }
      } catch (dynErr) {
        const msg = dynErr instanceof Error ? dynErr.message : String(dynErr);
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary: `Dinamik e2e hatası: ${msg.slice(0, 200)}`,
        });
      }
    }

    // ─── 8) REVIEW status'una geç ───
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

/**
 * Conversation history'ı token tasarrufu için kırp.
 *
 * İki katmanlı strateji (token bütçesini agresif kontrol altında tutar):
 *
 * 1) SELEKTİF TRIM (her iter'de) — eski iter'lerde:
 *    - read_file/list_dir/grep sonuçları "[okuma sonucu temizlendi]" stub'ı
 *    - write_file/edit_file çağrıları + sonuçları AYNEN kalır (kalıcı değişiklik)
 *    - finish çağrıları kalır
 *
 * 2) HARD CAP (history çok şişerse) — eski middle'ı tek özet'e sıkıştır
 */

const HISTORY_PREFIX = 3;
const HISTORY_RECENT_TURNS = 10;
/** Bu tool'lar geçici keşif — eski result'ları silinebilir */
const EPHEMERAL_TOOLS = new Set(["read_file", "list_dir", "grep"]);
/** Bu tool'ların çağrı + sonucu kalıcı — silinmemeli */
const PERSISTENT_TOOLS = new Set(["write_file", "edit_file", "finish"]);

function trimHistoryInPlace(history: Content[]) {
  // 1) Selektif: eski ephemeral tool result'larını stub'la
  trimEphemeralResults(history);

  // 2) Hard cap: hâlâ uzunsa middle'ı özet'e sıkıştır
  const max = HISTORY_PREFIX + HISTORY_RECENT_TURNS + 1;
  if (history.length <= max) return;

  const prefix = history.slice(0, HISTORY_PREFIX);
  const recent = history.slice(history.length - HISTORY_RECENT_TURNS);
  const middle = history.slice(HISTORY_PREFIX, history.length - HISTORY_RECENT_TURNS);

  // Persistent tool call'larını listele — bilgi kaybetmemek için
  const persistentCalls: string[] = [];
  const allCalls: string[] = [];
  for (const m of middle) {
    if (m.role !== "model") continue;
    for (const p of m.parts ?? []) {
      if ("functionCall" in p && p.functionCall) {
        const fc = p.functionCall;
        const argHint =
          fc.args && typeof fc.args === "object"
            ? Object.entries(fc.args as Record<string, unknown>)
                .map(([k, v]) => {
                  if (k === "content" || k === "new_string" || k === "old_string") {
                    return `${k}=<${Buffer.byteLength(String(v))}B>`;
                  }
                  return `${k}=${String(v).slice(0, 40)}`;
                })
                .join(" ")
            : "";
        const sig = `${fc.name}(${argHint})`;
        allCalls.push(sig);
        if (PERSISTENT_TOOLS.has(fc.name)) persistentCalls.push(sig);
      }
    }
  }

  const summaryLines: string[] = [
    `[Önceki ${middle.length / 2} tur sıkıştırıldı.]`,
  ];
  if (persistentCalls.length > 0) {
    summaryLines.push("Kalıcı değişiklikler:");
    for (const c of persistentCalls.slice(0, 15)) summaryLines.push(`  - ${c}`);
  }
  if (allCalls.length > persistentCalls.length) {
    summaryLines.push(
      `Diğer keşif: ${allCalls.length - persistentCalls.length} read/grep/list (sonuçlar silindi).`,
    );
  }

  history.length = 0;
  history.push(...prefix);
  history.push({ role: "user", parts: [{ text: summaryLines.join("\n") }] });
  history.push({ role: "model", parts: [{ text: "Anlaşıldı, devam ediyorum." }] });
  history.push(...recent);
}

/**
 * Recent turn'lardan ÖNCE gelen ephemeral tool result'larını "[temizlendi]" ile değiştir.
 * read_file/list_dir/grep sonuçları çok yer kaplar — silmenin maliyeti yok çünkü:
 *  - read sonuçları zaten readFiles map'inde snapshot olarak duruyor
 *  - grep sonuçları aktif iter'lerde tekrar yapılırsa dedup engelliyor
 */
function trimEphemeralResults(history: Content[]) {
  // Recent threshold — son 8 element içindeki sonuçlar olduğu gibi kalır
  const keepFrom = Math.max(0, history.length - 8);

  for (let i = HISTORY_PREFIX; i < keepFrom; i++) {
    const m = history[i];
    if (m.role !== "user") continue;
    const newParts: Part[] = [];
    let modified = false;
    for (const p of m.parts ?? []) {
      if ("functionResponse" in p && p.functionResponse) {
        const fr = p.functionResponse;
        if (EPHEMERAL_TOOLS.has(fr.name)) {
          newParts.push({
            functionResponse: {
              name: fr.name,
              response: {
                ok: true,
                cleared: true,
                hint: `[${fr.name} sonucu temizlendi — eski keşif, mevcut readFiles state'inde özet var]`,
              },
            },
          });
          modified = true;
          continue;
        }
      }
      newParts.push(p);
    }
    if (modified) m.parts = newParts;
  }
}

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
    if (typeof r.content === "string" && r.content.length > 25_000) {
      return { ...r, content: r.content.slice(0, 25_000), truncated: true };
    }
  }
  return result;
}
