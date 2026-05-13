import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export type ChangedPage = {
  /** Worktree-relatif dosya yolu */
  file: string;
  /** Tahmini URL — agent'ın dev server'ında goto için */
  url: string;
  /** Ekstra notlar (örn. dynamic route) */
  isDynamic: boolean;
};

/**
 * Worktree'de agent'ın bu task içinde değiştirdiği/oluşturduğu page.tsx dosyalarını çıkarır.
 * Returns: { file, url, isDynamic }
 *
 * Sadece UI sayfalarını döndürür (page.tsx). Server actions, component'ler atlanır.
 */
export async function getChangedPages(worktreeRoot: string): Promise<ChangedPage[]> {
  let changed: string[] = [];

  // git diff main..HEAD (commit'ten sonra) + index + untracked
  try {
    const { stdout: a } = await exec(
      "git",
      ["diff", "--name-only", "main", "HEAD"],
      { cwd: worktreeRoot, maxBuffer: 1024 * 1024 },
    );
    changed.push(...a.split("\n").filter(Boolean));
  } catch {}
  try {
    const { stdout: b } = await exec("git", ["diff", "--name-only"], {
      cwd: worktreeRoot,
      maxBuffer: 1024 * 1024,
    });
    for (const f of b.split("\n").filter(Boolean))
      if (!changed.includes(f)) changed.push(f);
  } catch {}
  try {
    const { stdout: c } = await exec(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      { cwd: worktreeRoot, maxBuffer: 1024 * 1024 },
    );
    for (const f of c.split("\n").filter(Boolean))
      if (!changed.includes(f)) changed.push(f);
  } catch {}

  const pages: ChangedPage[] = [];
  for (const file of changed) {
    if (!/\/page\.tsx$/.test(file)) continue;
    if (!file.startsWith("web/app/")) continue;
    const url = pageFileToUrl(file);
    if (!url) continue;
    pages.push({
      file,
      url,
      isDynamic: url.includes("["),
    });
  }
  return pages;
}

/**
 * "web/app/shop/account/settings/page.tsx" → "/shop/account/settings"
 * "web/app/(admin)/admin/products/page.tsx" → "/admin/products"
 * "web/app/page.tsx" → "/"
 * "web/app/shop/(info)/yardim/page.tsx" → "/shop/yardim"
 */
function pageFileToUrl(file: string): string | null {
  let p = file.replace(/^web\/app\//, "").replace(/\/page\.tsx$/, "");
  // Remove route groups: (admin), (info), (auth) — bunlar URL'i etkilemez
  p = p
    .split("/")
    .filter((seg) => !/^\([^)]+\)$/.test(seg))
    .join("/");
  if (!p) return "/";
  return "/" + p;
}

/**
 * Dinamik route'ları çıkar — agent kendisi yarattığı için seed yok.
 * Sadece statik yolları test edebiliriz.
 */
export function filterTestable(pages: ChangedPage[]): ChangedPage[] {
  return pages.filter((p) => !p.isDynamic);
}
