import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const REPO_ROOT = process.env.AGENT_REPO_ROOT ?? "/opt/commerceos";
const BASE = process.env.AGENT_WORKTREE_BASE ?? "/tmp/agent-runs";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Commit message'ından newline ve control karakterleri çıkar.
 * execFile shell injection vermez ama multi-line message subtle ekleme yapar.
 */
function sanitizeMessage(msg: string): string {
  return msg
    .replace(/[\r\n\t\v\f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export type Worktree = {
  taskId: string;
  branch: string;
  path: string;
  webPath: string; // worktree/web
};

export async function createWorktree(
  taskId: string,
  title: string,
  opts: { existingBranch?: string | null } = {},
): Promise<Worktree> {
  const wt = path.join(BASE, taskId);
  const webPath = path.join(wt, "web");

  // ── Reuse path ── feedback iterasyonu için
  if (opts.existingBranch) {
    const exists = await fs
      .stat(webPath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      return { taskId, branch: opts.existingBranch, path: wt, webPath };
    }
  }

  const slug = `${slugify(title) || "task"}-${taskId.slice(-6)}`;
  const branch = opts.existingBranch ?? `agent/${slug}`;

  await fs.mkdir(BASE, { recursive: true });

  // Var olan worktree veya branch'i temizle
  try {
    await exec("git", ["worktree", "remove", "--force", wt], { cwd: REPO_ROOT });
  } catch {
    // yok, sorun değil
  }
  try {
    await exec("git", ["branch", "-D", branch], { cwd: REPO_ROOT });
  } catch {
    // yok, sorun değil
  }

  // Worktree'yi main'den oluştur
  await exec("git", ["worktree", "add", "-b", branch, wt, "main"], {
    cwd: REPO_ROOT,
    maxBuffer: 1024 * 1024 * 4,
  });


  // node_modules: Turbopack symlink'i "filesystem root dışı" diye reddeder.
  // Hardlink mirror (cp -al) → gerçek directory görünür ama disk paylaşılır.
  const nm = path.join(webPath, "node_modules");
  const nmExists = await fs
    .stat(nm)
    .then(() => true)
    .catch(() => false);
  if (!nmExists) {
    try {
      await exec("cp", ["-al", path.join(REPO_ROOT, "web", "node_modules"), nm], {
        maxBuffer: 1024 * 1024 * 4,
      });
    } catch {
      // hardlink başarısız → fallback olarak symlink dene; webpack bunu tolere eder
      try {
        await fs.symlink(path.join(REPO_ROOT, "web", "node_modules"), nm, "dir");
      } catch {}
    }
  }

  // .next, test-results gibi build artifact'leri taşımayalım
  return { taskId, branch, path: wt, webPath };
}

export async function destroyWorktree(taskId: string, branch?: string) {
  const wt = path.join(BASE, taskId);
  try {
    await exec("git", ["worktree", "remove", "--force", wt], { cwd: REPO_ROOT });
  } catch {
    // dosya sisteminden kalıntı varsa zorla sil
    try {
      await fs.rm(wt, { recursive: true, force: true });
    } catch {}
  }
  if (branch) {
    try {
      await exec("git", ["branch", "-D", branch], { cwd: REPO_ROOT });
    } catch {}
  }
}

export async function commitWorktree(
  wt: Worktree,
  message: string,
  author: { name: string; email: string },
): Promise<{ ok: true; sha: string; filesChanged: number } | { ok: false; reason: string }> {
  // Staged dosyaları kontrol et
  await exec("git", ["add", "-A"], { cwd: wt.path });
  const { stdout: status } = await exec("git", ["status", "--porcelain"], { cwd: wt.path });
  if (status.trim().length === 0) {
    return { ok: false, reason: "Değişiklik yok, commit atılmadı" };
  }
  const filesChanged = status.split("\n").filter(Boolean).length;
  await exec(
    "git",
    [
      "-c",
      `user.name=${author.name}`,
      "-c",
      `user.email=${author.email}`,
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-m",
      sanitizeMessage(message),
    ],
    { cwd: wt.path, maxBuffer: 1024 * 1024 * 4 },
  );
  const { stdout: sha } = await exec("git", ["rev-parse", "HEAD"], { cwd: wt.path });
  return { ok: true, sha: sha.trim(), filesChanged };
}

export async function mergeBranchToMain(branch: string, _message: string) {
  // Agent branch main'den dallandı ve sadece 1 agent commit'i içeriyor —
  // FF-only ile linear history; merge commit yaratma. GitHub'da kullanıcı
  // sadece "CommerceOS-Agent-Project-Feature ... committed" görür, ekstra
  // "umutsrgncn merged" kafa karışıklığı olmaz.
  // FF fail ederse (main bu süre içinde ilerlemişse), no-ff fallback ile
  // umutsrgncn identity'siyle merge — bu nadir durum.
  await exec("git", ["checkout", "main"], { cwd: REPO_ROOT });
  try {
    await exec("git", ["merge", "--ff-only", branch], {
      cwd: REPO_ROOT,
      maxBuffer: 1024 * 1024 * 4,
    });
  } catch {
    const author = {
      name: "umutsrgncn",
      email: "56017037+umutsrgncn@users.noreply.github.com",
    };
    await exec(
      "git",
      [
        "-c",
        `user.name=${author.name}`,
        "-c",
        `user.email=${author.email}`,
        "-c",
        "commit.gpgsign=false",
        "merge",
        "--no-ff",
        branch,
        "-m",
        sanitizeMessage(_message),
      ],
      {
        cwd: REPO_ROOT,
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: author.name,
          GIT_AUTHOR_EMAIL: author.email,
          GIT_COMMITTER_NAME: author.name,
          GIT_COMMITTER_EMAIL: author.email,
        },
        maxBuffer: 1024 * 1024 * 4,
      },
    );
  }
}

/**
 * Main branch'i GitHub origin'e push et. VPS deploy key'i read-only ise hata
 * fırlatır — runner catch edip kullanıcıya raporlar (manuel push gerek).
 */
export async function pushMainToOrigin(): Promise<void> {
  await exec("git", ["push", "origin", "main"], {
    cwd: REPO_ROOT,
    maxBuffer: 1024 * 1024 * 4,
  });
}

export function repoRoot() {
  return REPO_ROOT;
}
