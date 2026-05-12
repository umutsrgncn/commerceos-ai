import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { promises as fs } from "node:fs";
import path from "node:path";

import { emitAgentEvent } from "./events";
import type { Worktree } from "./worktree";

/**
 * Tek bir aktif preview tutulur (single concurrency kuralı).
 * Worktree'de `next dev --port=<port>` + cloudflared tunnel başlatır.
 * REVIEW status'una geçilirken çağrılır, approve/reject/cancel'da kapatılır.
 */

type PreviewState = {
  taskId: string;
  port: number;
  devProc: ChildProcess;
  tunnelProc: ChildProcess;
  tunnelUrl?: string;
  cleanup: () => Promise<void>;
};

let active: PreviewState | null = null;

const BASE_PORT_FROM = 3100;
const BASE_PORT_TO = 3199;
const READY_TIMEOUT_MS = 90_000;
const TUNNEL_TIMEOUT_MS = 30_000;

export async function startPreview(opts: {
  taskId: string;
  wt: Worktree;
  emit?: typeof emitAgentEvent;
}): Promise<{ port: number; tunnelUrl: string | null }> {
  // Önceki preview hâlâ açıksa kapat
  if (active) {
    await stopPreview(active.taskId, "yeni preview başlatılıyor");
  }

  const emit = opts.emit ?? emitAgentEvent;
  const port = await findFreePort();

  // 1) next dev başlat
  await emit({
    taskId: opts.taskId,
    type: "TUNNEL",
    summary: `Önizleme sunucusu başlatılıyor (port ${port})…`,
    payload: { port },
  });
  // Turbopack symlink'li node_modules'u reddediyor — webpack mode + explicit flag'ler.
  const devProc = spawn(
    "pnpm",
    ["exec", "next", "dev", "--port", String(port), "--hostname", "127.0.0.1"],
    {
      cwd: opts.wt.webPath,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  // Logları dosyaya yaz — debug için
  const logDir = path.join(opts.wt.path, ".agent-logs");
  await fs.mkdir(logDir, { recursive: true });
  const devLog = path.join(logDir, "dev.log");
  const devLogFd = await fs.open(devLog, "w");
  let devLogClosed = false;
  const writeDev = (d: Buffer) => {
    if (devLogClosed) return;
    devLogFd.write(d).catch(() => {});
  };
  devProc.stdout?.on("data", writeDev);
  devProc.stderr?.on("data", writeDev);

  // "Ready" sinyalini bekle
  const ready = await waitForReady(devProc, READY_TIMEOUT_MS);
  if (!ready) {
    devProc.kill("SIGTERM");
    await devLogFd.close();
    throw new Error(`next dev başlamadı (${READY_TIMEOUT_MS / 1000}s timeout) — log: ${devLog}`);
  }
  await emit({
    taskId: opts.taskId,
    type: "TUNNEL",
    summary: `Önizleme sunucusu hazır: 127.0.0.1:${port}`,
    payload: { port },
  });

  // 2) cloudflared tunnel başlat
  const tunnelProc = spawn(
    "cloudflared",
    ["tunnel", "--no-autoupdate", "--url", `http://localhost:${port}`],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    },
  );
  const tunnelLog = path.join(logDir, "tunnel.log");
  const tunnelLogFd = await fs.open(tunnelLog, "w");
  let tunnelLogClosed = false;
  const writeTunnel = (d: Buffer) => {
    if (tunnelLogClosed) return;
    tunnelLogFd.write(d).catch(() => {});
  };
  tunnelProc.stdout?.on("data", writeTunnel);
  tunnelProc.stderr?.on("data", writeTunnel);

  const tunnelUrl = await waitForTunnelUrl(tunnelProc, TUNNEL_TIMEOUT_MS);
  if (tunnelUrl) {
    await emit({
      taskId: opts.taskId,
      type: "TUNNEL",
      summary: `Tunnel hazır: ${tunnelUrl}`,
      payload: { url: tunnelUrl },
    });
  } else {
    await emit({
      taskId: opts.taskId,
      type: "ERROR",
      summary: "Tunnel URL'i 30sn içinde alınamadı — preview yine de localhost'ta çalışıyor.",
      payload: { port },
    });
  }

  const cleanup = async () => {
    try {
      tunnelProc.kill("SIGTERM");
    } catch {}
    try {
      devProc.kill("SIGTERM");
    } catch {}
    // Kill garantisi
    setTimeout(() => {
      try {
        tunnelProc.kill("SIGKILL");
      } catch {}
      try {
        devProc.kill("SIGKILL");
      } catch {}
    }, 5000).unref();
    devLogClosed = true;
    tunnelLogClosed = true;
    try {
      await devLogFd.close();
    } catch {}
    try {
      await tunnelLogFd.close();
    } catch {}
  };

  active = {
    taskId: opts.taskId,
    port,
    devProc,
    tunnelProc,
    tunnelUrl: tunnelUrl ?? undefined,
    cleanup,
  };

  return { port, tunnelUrl };
}

export async function stopPreview(taskId: string, reason?: string) {
  if (!active) return;
  if (active.taskId !== taskId) return; // başka task'ın preview'ı
  const a = active;
  active = null;
  try {
    await emitAgentEvent({
      taskId,
      type: "TUNNEL",
      summary: `Önizleme kapatıldı${reason ? ` (${reason})` : ""}.`,
    });
  } catch {}
  await a.cleanup();
}

export function getActivePreview() {
  return active
    ? { taskId: active.taskId, port: active.port, tunnelUrl: active.tunnelUrl }
    : null;
}

// ─── helpers ───

async function findFreePort(): Promise<number> {
  for (let p = BASE_PORT_FROM; p <= BASE_PORT_TO; p++) {
    if (await isFree(p)) return p;
  }
  throw new Error(`Boş port bulunamadı (${BASE_PORT_FROM}-${BASE_PORT_TO})`);
}

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => {
      s.close(() => resolve(true));
    });
    s.listen(port, "127.0.0.1");
  });
}

function waitForReady(proc: ChildProcess, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const onChunk = (buf: Buffer) => {
      const s = buf.toString("utf8");
      if (/Ready in|Local:\s*http/i.test(s) && !done) {
        done = true;
        cleanup();
        resolve(true);
      }
    };
    const onExit = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      proc.stdout?.off("data", onChunk);
      proc.stderr?.off("data", onChunk);
      proc.off("exit", onExit);
      clearTimeout(t);
    };
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve(false);
    }, timeoutMs);
    proc.stdout?.on("data", onChunk);
    proc.stderr?.on("data", onChunk);
    proc.once("exit", onExit);
  });
}

function waitForTunnelUrl(proc: ChildProcess, timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    let done = false;
    const onChunk = (buf: Buffer) => {
      const s = buf.toString("utf8");
      const m = s.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (m && !done) {
        done = true;
        cleanup();
        resolve(m[0]);
      }
    };
    const cleanup = () => {
      proc.stdout?.off("data", onChunk);
      proc.stderr?.off("data", onChunk);
      clearTimeout(t);
    };
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve(null);
    }, timeoutMs);
    proc.stdout?.on("data", onChunk);
    proc.stderr?.on("data", onChunk);
  });
}
