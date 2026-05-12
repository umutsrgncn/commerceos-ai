/**
 * Agent worker CLI entry.
 *
 * Çalıştırma:
 *   cd web && pnpm agent:worker
 *   (yani: tsx --env-file=.env.local scripts/agent-worker.ts)
 *
 * Devamlı poll'lar — PENDING task gelirse işler. SIGINT ile temiz çıkar.
 */
import { runWorkerLoop, stopWorker } from "../lib/agent/worker";

process.on("SIGINT", () => {
  // eslint-disable-next-line no-console
  console.log("[agent/worker] SIGINT alındı, kapatılıyor…");
  stopWorker();
  setTimeout(() => process.exit(0), 5000);
});

process.on("SIGTERM", () => {
  stopWorker();
  setTimeout(() => process.exit(0), 5000);
});

runWorkerLoop().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[agent/worker] fatal:", err);
  process.exit(1);
});
