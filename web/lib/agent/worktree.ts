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

export type Worktree = {
  taskId: string;
  branch: string;
  path: string;
  webPath: string; // worktree/web
};

export async function createWorktree(taskId: string, title: string): Promise<Worktree> {
  const slug = `${slugify(title) || "task"}-${taskId.slice(-6)}`;
  const branch = `agent/${slug}`;
  const wt = path.join(BASE, taskId);

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

  const webPath = path.join(wt, "web");

  // node_modules paylaşım: symlink (build hızı için)
  const nm = path.join(webPath, "node_modules");
  const nmExists = await fs
    .stat(nm)
    .then(() => true)
    .catch(() => false);
  if (!nmExists) {
    try {
      await fs.symlink(path.join(REPO_ROOT, "web", "node_modules"), nm, "dir");
    } catch (err) {
      // symlink başarısız → devam et, agent yine de okuma/yazma yapabilir,
      // sadece tsc/test bunu kullanacak
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
      message,
    ],
    { cwd: wt.path, maxBuffer: 1024 * 1024 * 4 },
  );
  const { stdout: sha } = await exec("git", ["rev-parse", "HEAD"], { cwd: wt.path });
  return { ok: true, sha: sha.trim(), filesChanged };
}

export async function mergeBranchToMain(branch: string, message: string) {
  await exec("git", ["checkout", "main"], { cwd: REPO_ROOT });
  await exec("git", ["merge", "--no-ff", branch, "-m", message], {
    cwd: REPO_ROOT,
    maxBuffer: 1024 * 1024 * 4,
  });
}

export function repoRoot() {
  return REPO_ROOT;
}
