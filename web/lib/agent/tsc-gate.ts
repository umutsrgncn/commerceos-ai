import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const TSC_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_LINES = 80;

export type TscResult =
  | { ok: true }
  | { ok: false; errors: string; errorCount: number };

/**
 * Worktree'de `pnpm tsc --noEmit` çalıştır.
 * Sadece web/ klasöründe çalışır.
 * Sonuç dönerken kullanıcı kodundaki hataları yakalar — pre-existing typedRoutes
 * vs. hataları her zaman varlığını sürdürür, bunlar filtrelenmez (agent görsün).
 */
export async function runTsc(webPath: string): Promise<TscResult> {
  try {
    await exec("pnpm", ["tsc", "--noEmit"], {
      cwd: webPath,
      maxBuffer: 1024 * 1024 * 8,
      timeout: TSC_TIMEOUT_MS,
    });
    return { ok: true };
  } catch (err) {
    // tsc fail → stdout'ta hata listesi
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr: string }).stderr ?? "")
        : "";
    const stdout =
      err && typeof err === "object" && "stdout" in err
        ? String((err as { stdout: string }).stdout ?? "")
        : "";
    const allOutput = (stdout + "\n" + stderr).trim();

    // Pre-existing hataları say
    const lines = allOutput.split("\n").filter(Boolean);
    const errorLines = lines.filter((l) => /error TS\d+:/.test(l));

    // Sadece relatif path'li (agent'ın yazdığı) hataları gösterelim
    // Pre-existing typedRoutes hatalarını agent halen görür ama büyük listeyi keseriz.
    const head = errorLines.slice(0, MAX_OUTPUT_LINES).join("\n");
    return {
      ok: false,
      errors: head || allOutput.slice(0, 4000),
      errorCount: errorLines.length,
    };
  }
}

/**
 * Pre-existing typedRoutes/RouteImpl hatalarını filtrele.
 * Bu hatalar repo'da zaten var, agent'ın yazdığı değil — odağı dağıtmasın.
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
