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
 * `agentTouchedFiles` verilirse SADECE o dosyalardan gelen hatalar gate'i tetikler.
 * Baseline hataları (projede zaten olanlar) agent'ı bloke etmez.
 */
export async function runTsc(
  webPath: string,
  agentTouchedFiles?: string[],
): Promise<TscResult> {
  try {
    await exec("pnpm", ["tsc", "--noEmit"], {
      cwd: webPath,
      maxBuffer: 1024 * 1024 * 8,
      timeout: TSC_TIMEOUT_MS,
    });
    return { ok: true };
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr: string }).stderr ?? "")
        : "";
    const stdout =
      err && typeof err === "object" && "stdout" in err
        ? String((err as { stdout: string }).stdout ?? "")
        : "";
    const allOutput = (stdout + "\n" + stderr).trim();

    const lines = allOutput.split("\n").filter(Boolean);
    const allErrorLines = lines.filter((l) => /error TS\d+:/.test(l));

    // Agent'ın yazdığı dosyalarla sınırla — baseline hataları reject etmesin
    let errorLines = allErrorLines;
    if (agentTouchedFiles && agentTouchedFiles.length > 0) {
      // Path'leri normalize et (web/ prefix var/yok, baş ./ var/yok)
      const norms = agentTouchedFiles.map((f) =>
        f.replace(/^\.?\/+/, "").replace(/^web\//, ""),
      );
      errorLines = allErrorLines.filter((l) =>
        norms.some((n) => l.includes(n)),
      );
    }

    if (errorLines.length === 0) {
      // Sadece baseline hataları → agent'ı geçir, hata yok say
      return { ok: true };
    }

    const head = errorLines.slice(0, MAX_OUTPUT_LINES).join("\n");
    return {
      ok: false,
      errors: head,
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
