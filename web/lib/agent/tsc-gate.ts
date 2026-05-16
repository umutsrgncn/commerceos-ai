import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const TSC_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_LINES = 80;

/**
 * Baseline = task başında main'de var olan tsc hatalarının fingerprint set'i.
 * file:line:errorCode formatında. captureTscBaseline ile snapshot alınır,
 * runTsc(wt, baseline) ile karşılaştırılır → sadece agent'ın yarattığı YENİ
 * hatalar reject eder. Bu sayede agent başka bir dosyada (örn. notifications/
 * route.ts) cross-impact hata yarattığında da yakalanır.
 */
export type TscBaseline = Set<string>;

const ERROR_LINE_RE = /^(.+?)\((\d+),\d+\): error (TS\d+):/;

export type TscResult =
  | { ok: true }
  | { ok: false; errors: string; errorCount: number };

async function runTscRaw(webPath: string): Promise<string> {
  try {
    await exec("pnpm", ["tsc", "--noEmit"], {
      cwd: webPath,
      maxBuffer: 1024 * 1024 * 8,
      timeout: TSC_TIMEOUT_MS,
    });
    return "";
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr: string }).stderr ?? "")
        : "";
    const stdout =
      err && typeof err === "object" && "stdout" in err
        ? String((err as { stdout: string }).stdout ?? "")
        : "";
    return (stdout + "\n" + stderr).trim();
  }
}

function parseFingerprints(output: string): Set<string> {
  const set = new Set<string>();
  for (const line of output.split("\n")) {
    const m = line.match(ERROR_LINE_RE);
    if (m) set.add(`${m[1]}:${m[2]}:${m[3]}`);
  }
  return set;
}

/**
 * Task başında main durumunda olan tsc hatalarını snapshot al. Bu set,
 * agent'ın değişikliklerinden sonra runTsc ile karşılaştırılır.
 * Hatasız ise boş Set döner. ~60s sürer, task'a kez başında çağrılır.
 */
export async function captureTscBaseline(webPath: string): Promise<TscBaseline> {
  const output = await runTscRaw(webPath);
  return parseFingerprints(output);
}

/**
 * Worktree'de tsc çalıştır, baseline'a göre YENİ hatalar kaldıysa fail.
 * Agent başka bir dosyada cross-impact hata yarattıysa (export silme,
 * rename) burada yakalanır — eski "agentTouchedFiles filtresi"nin kaçırdığı
 * en kritik durum bu.
 */
export async function runTsc(
  webPath: string,
  baseline?: TscBaseline,
): Promise<TscResult> {
  const output = await runTscRaw(webPath);
  if (!output) return { ok: true };

  const allErrorLines = output
    .split("\n")
    .filter((l) => /error TS\d+:/.test(l));

  let newErrorLines = allErrorLines;
  if (baseline && baseline.size > 0) {
    newErrorLines = allErrorLines.filter((line) => {
      const m = line.match(ERROR_LINE_RE);
      if (!m) return true; // parse edilmeyen → yine de say (güvenli taraf)
      return !baseline.has(`${m[1]}:${m[2]}:${m[3]}`);
    });
  }

  if (newErrorLines.length === 0) return { ok: true };

  const head = newErrorLines.slice(0, MAX_OUTPUT_LINES).join("\n");
  return {
    ok: false,
    errors: head,
    errorCount: newErrorLines.length,
  };
}

/**
 * Pre-existing typedRoutes/RouteImpl hatalarını filtrele.
 * Baseline diff devreye girdiği için artık bunlar zaten süzülüyor, ancak
 * mesaj ekranda kullanıcıya gösterilirken yine de odağı dağıtmasın diye
 * helper export tutuluyor.
 */
export function filterAgentRelevantErrors(errors: string): string {
  const PRE_EXISTING_PATTERNS = [
    /RouteImpl/,
    /typedRoutes/,
    /UrlObject \| RouteImpl/,
  ];
  const lines = errors.split("\n").filter(Boolean);
  const relevant = lines.filter((l) => {
    return !PRE_EXISTING_PATTERNS.some((p) => p.test(l));
  });
  return relevant.join("\n");
}
