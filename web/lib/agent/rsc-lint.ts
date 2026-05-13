import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const CLIENT_HOOKS = [
  "useState",
  "useEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "useReducer",
  "useContext",
  "useLayoutEffect",
  "useDeferredValue",
  "useTransition",
  "useId",
  "useSyncExternalStore",
  "useActionState",
  "useFormStatus",
  "useFormState",
  "useOptimistic",
];

const SERVER_ONLY_APIS = [
  "headers",
  "cookies",
  "draftMode",
  "unstable_noStore",
];

export type RscIssue = {
  file: string;
  kind: "client-hook-in-server" | "server-api-in-client" | "use-client-with-async-default";
  detail: string;
};

export type RscLintResult =
  | { ok: true }
  | { ok: false; issues: RscIssue[] };

/**
 * Agent'ın yazdığı bir dosyada Next.js RSC kurallarını kontrol eder.
 *
 * Yakaladıkları:
 *   1. Client hook'lar (useState, useActionState, vs.) "use client" olmayan dosyada
 *   2. Server-only API'lar (headers, cookies) "use client" olan dosyada
 *   3. "use client" + async function default export (RSC değil, hook'lar async server function'da olamaz)
 */
export async function lintRscFile(absPath: string, relPath: string): Promise<RscIssue[]> {
  const issues: RscIssue[] = [];
  let content: string;
  try {
    content = await fs.readFile(absPath, "utf8");
  } catch {
    return issues;
  }

  // Sadece tsx/ts dosyaları
  if (!/\.(tsx|ts)$/.test(relPath)) return issues;
  // node_modules vs.
  if (relPath.includes("node_modules") || relPath.includes(".next")) return issues;

  const head = content.slice(0, 400);
  const hasUseClient = /^\s*["']use client["'];?\s*$/m.test(head);

  // 1) Client hook'lar server dosyada
  if (!hasUseClient) {
    for (const hook of CLIENT_HOOKS) {
      const re = new RegExp(`\\bimport\\s*\\{[^}]*\\b${hook}\\b[^}]*\\}\\s+from\\s+["']react(-dom)?["']`);
      if (re.test(content)) {
        issues.push({
          file: relPath,
          kind: "client-hook-in-server",
          detail: `'${hook}' import edilmiş ama dosya 'use client' değil. ÇÖZÜM: form/etkileşim için ayrı bir client component dosyası oluştur (\`"use client"\` ile başlayan), ondan import et. Mevcut dosya server component olarak kalsın (async default export, getCurrentCustomer vb.).`,
        });
        break; // tek mesaj yeter — agent çoğul örnekte zaten anlar
      }
    }
  }

  // 2) Server API'lar client dosyada
  if (hasUseClient) {
    for (const api of SERVER_ONLY_APIS) {
      const re = new RegExp(`\\bimport\\s*\\{[^}]*\\b${api}\\b[^}]*\\}\\s+from\\s+["']next/headers["']`);
      if (re.test(content)) {
        issues.push({
          file: relPath,
          kind: "server-api-in-client",
          detail: `'${api}' (next/headers) client component'te kullanılamaz. ÇÖZÜM: bu işlevi server-side bir helper veya page.tsx'e taşı.`,
        });
        break;
      }
    }

    // 3) "use client" + async default export
    if (/^\s*export\s+default\s+async\s+function/m.test(content)) {
      issues.push({
        file: relPath,
        kind: "use-client-with-async-default",
        detail: `'use client' dosyalarında async default export olamaz. ÇÖZÜM: ya 'use client' direktifini kaldır (server component yap), ya da async'i kaldır (data fetching için server component'i parent'ta tut, bu dosya sadece etkileşimli kısmı tutsun).`,
      });
    }
  }

  return issues;
}

/**
 * Bir worktree'de agent'ın bu task içinde dokunduğu tüm dosyaları lint eder.
 * `git diff --name-only main` ile değişen dosyaları yakalar.
 */
export async function lintChangedFiles(worktreeRoot: string): Promise<RscLintResult> {
  let changed: string[] = [];
  try {
    const { stdout } = await exec("git", ["diff", "--name-only", "main", "HEAD"], {
      cwd: worktreeRoot,
      maxBuffer: 1024 * 1024,
    });
    changed = stdout.split("\n").filter(Boolean);
    // Unstaged değişiklikleri de ekle (commit'ten önceki state için)
    const { stdout: unstaged } = await exec("git", ["diff", "--name-only"], {
      cwd: worktreeRoot,
      maxBuffer: 1024 * 1024,
    });
    for (const f of unstaged.split("\n").filter(Boolean)) {
      if (!changed.includes(f)) changed.push(f);
    }
    const { stdout: untracked } = await exec(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      { cwd: worktreeRoot, maxBuffer: 1024 * 1024 },
    );
    for (const f of untracked.split("\n").filter(Boolean)) {
      if (!changed.includes(f)) changed.push(f);
    }
  } catch {
    return { ok: true };
  }

  const issues: RscIssue[] = [];
  for (const rel of changed) {
    const abs = path.join(worktreeRoot, rel);
    const fileIssues = await lintRscFile(abs, rel);
    issues.push(...fileIssues);
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

export function formatIssuesForAgent(issues: RscIssue[]): string {
  return issues
    .map((i, idx) => `${idx + 1}. ${i.file} → ${i.detail}`)
    .join("\n\n");
}
