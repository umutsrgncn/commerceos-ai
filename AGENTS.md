# Project guide for the coding agent

CommerceOS — Next.js 15 (App Router) + Prisma + Postgres + Auth.js v5 + Tailwind 4.

This file is loaded automatically before every task. Follow the conventions in it; they are the difference between a passing change and a build break.

---

## Stack & runtime

- **Next.js 15 App Router** with `typedRoutes` enabled.
- **TypeScript strict.** `next.config.ts` has `typescript.ignoreBuildErrors: true` but TSC errors still break editor/devtools — write correct types.
- **Prisma 6** (`@prisma/client`) — all DB models in `prisma/schema.prisma`.
- **Auth.js v5** — session in `auth.ts`; admin routes guarded by middleware.
- **Tailwind 4** — utility classes only; theme tokens via CSS variables (`var(--color-*)`).
- **shadcn-style UI primitives** in `components/ui/` (Button, Card, Input, Label, Select, Switch…).

---

## Server vs. client — the #1 rule

**Files under `app/.../page.tsx` are server components by default.** Adding `"use client"` to a `page.tsx` that has any of the following will break the build:

- `export const metadata = { ... }` (server-only)
- `export default async function Page()` (Next 15 async pages are server-only)
- A call to a function that imports `@/lib/db`, `@/lib/queries/*`, or any `lib/*` module that uses Prisma / auth / `cookies()` / `headers()`.

If a page needs interactivity (`onClick`, `useState`, `useEffect`, `localStorage`, downloading a Blob, etc.), do **NOT** flip the page to client. Instead:

1. Keep `page.tsx` as a server component.
2. Create a sibling file: `app/.../components/<feature>-<role>.tsx` with `"use client"` at the top.
3. Render the client component from the server page and pass it the pre-computed data via props (plain JSON-serializable values).

### Canonical patterns in this repo (read these before writing similar code):

| Pattern | Server page | Client child |
| --- | --- | --- |
| Form that submits via server action | `app/(admin)/admin/settings/page.tsx` | `app/(admin)/admin/settings/components/settings-form.tsx` |
| Page with charts / interactive panel | `app/(admin)/admin/finance/page.tsx` | `app/(admin)/admin/finance/components/cashflow-forecast.tsx`, `finance-ai-panel.tsx` |
| List + bulk-action bar | `app/(admin)/admin/orders/page.tsx` | `app/(admin)/admin/orders/components/bulk-invoice-bar.tsx` |
| Dashboard with AI panel | `app/(admin)/admin/page.tsx` | `components/dashboard/anomaly-banner.tsx` |

If you need to add a button that runs in the browser (download CSV, copy to clipboard, open dialog, etc.) **always** create a new client component file. Never inline `"use client"` into a page that already exports `metadata` or is `async`.

---

## Importing UI primitives

- `import { Button } from "@/components/ui/button";`
- `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";`
- `import { Input } from "@/components/ui/input";`
- `import { Label } from "@/components/ui/label";`
- Icons: `lucide-react` — only import what you use.

`CardTitle` renders an `<h3>` — `getByRole("heading")` selectors target it.

---

## Routing

- `typedRoutes: true` — Next emits a typed `Route` for every literal `href` value. When passing a `string | null` to `<Link href={...}>` you must narrow with a guard or cast. Existing code at `admin/activity/page.tsx` already shows this pattern; replicate it rather than fight the type.
- Prefer `<Link href="/admin/foo">` over `useRouter().push("/admin/foo")` in server components.

---

## Database access

- Always import `import { db } from "@/lib/db";`. Never instantiate `new PrismaClient()` anywhere except `lib/db.ts`.
- Queries live in `lib/queries/<domain>.ts`. If a page needs a query that doesn't exist yet, add a new exported function there — do not inline complex `db.x.findMany()` calls in `page.tsx`.
- Mutations live in `lib/actions/<domain>.ts` with `"use server"` at the top. Server actions take a `FormData` or a typed object, validate with Zod, and call `revalidatePath`.

---

## Styling

- All colors via CSS variables: `text-[color:var(--color-fg)]`, `bg-[color:var(--color-bg)]`, `border-[color:var(--color-border)]`.
- Muted text: `text-[color:var(--color-muted)]`.
- Subtle bg layer: `bg-[color:var(--color-fg)]/[0.04]`.
- Always include dark-mode variants; never hard-code `text-black` / `bg-white`.

---

## Adding a feature — checklist

Before declaring a task done, run through this mentally:

1. **Did I touch a `page.tsx` that has `async` or `metadata` export?**  
   If yes: I did **not** add `"use client"` to it. Any interactivity went into a new sibling client file.
2. **Are all my imports used?**  
   No `Button` import without a `<Button>` JSX usage.
3. **Did I add a button or input that does something?**  
   The handler is wired (`onClick={…}`, `action={…}`) — not just rendered.
4. **Did I touch a route? Will `typedRoutes` accept my `href`?**  
   For dynamic `string | null` hrefs use a guard before passing to `<Link>`.
5. **Did I add a new DB call?**  
   It went through `lib/queries/` or `lib/actions/`, not inline in JSX.
6. **Does the dev server compile without errors?**  
   If the build gate reports TSC errors, **read and fix them**. Don't add the same change again — it won't compile this time either.

---

## Dokunulmaz dosyalar — agent yazamaz

The following are **off-limits** for any task. They define environment, dependencies, security, or schema, and any write here will be rejected at commit gate (task → FAILED):

- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `tsconfig.json`, `next.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `postcss.config.mjs`
- Anything under `prisma/` (schema, migrations)
- Anything under `web/auth.ts`, `web/auth.config.ts`, `middleware.ts`, `lib/auth/`
- Any `.env*` file
- `docker-compose.yml`, `Dockerfile`, `.github/`, `AGENTS.md`

If a task **looks like** it needs a new dependency, a Prisma model change, or auth/middleware tweak: **REFUSE the task and explain why** — humans need to decide that. Do not "fix" build errors by installing packages.

## When TSC reports errors you didn't cause

The repo carries ~20 pre-existing TSC errors (mostly `typedRoutes` noise on `<Link href={string}>` — masked by `typescript.ignoreBuildErrors: true` in `next.config.ts`). These existed before your task and are not yours to fix.

The TSC build gate that runs after your task **filters to only the files you touched**. If you see errors flagged on files in your diff, those are yours — fix them. If you see errors on other files, ignore them.

**Never** run `pnpm add`, `pnpm install`, `pnpm update`, or modify lockfiles to "fix" TSC errors. Missing modules are an environment quirk; do not commit a dependency change as a workaround.

## Anti-patterns observed in past failed tasks

- ❌ Adding `"use client"` to an `async` `page.tsx` to "make a button work". → Build break. Use a sibling client component instead.
- ❌ Importing `{ Button } from "@/components/ui/button"` and never rendering it. → Unused import + the feature isn't actually built.
- ❌ Six `write` calls to the same file in a row without reading between them. → You are guessing; stop, re-read the file in full, then write once.
- ❌ Declaring "tamamlandı" while TSC has errors on the file you just touched. → It isn't done. Fix the errors in the same session.
- ❌ Seeing pre-existing TSC errors and running `pnpm add -D typescript` / `pnpm install` / modifying `pnpm-lock.yaml`. → That's not a fix, that's a panic move. The errors aren't yours; the task is done.
- ❌ Modifying `package.json` to make build work. → If your task didn't require a new dep, you don't need one. Stop, re-read your diff, finish the actual feature.

---

## Glossary (Turkish project — keep UI strings Turkish)

UI is Turkish. Code comments may be Turkish or English. Variable / function names are English. Examples of Turkish strings you'll often need:

- "Kaydet" — save
- "İptal" — cancel
- "Sil" — delete
- "CSV indir" — download CSV
- "Yükleniyor…" — loading…
- Use ₺ for TRY, dates in `tr-TR` locale.
