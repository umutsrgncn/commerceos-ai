"use client";

import { useMemo, useState } from "react";
import { Check, Lock, Search, Store, Shield, Layers } from "lucide-react";

import { AGENT_SCOPES, type AgentScope } from "@/lib/agent/scopes";

const GROUP_META: Record<AgentScope["group"], { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  shop: {
    label: "Müşteri tarafı",
    icon: Store,
    accent: "text-emerald-600 dark:text-emerald-300",
  },
  admin: {
    label: "Yönetici tarafı",
    icon: Shield,
    accent: "text-indigo-600 dark:text-indigo-300",
  },
  shared: {
    label: "Paylaşılan",
    icon: Layers,
    accent: "text-amber-600 dark:text-amber-300",
  },
};

export function ScopePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const lower = q.trim().toLowerCase();

  const grouped = useMemo(() => {
    const out: Record<AgentScope["group"], AgentScope[]> = { shop: [], admin: [], shared: [] };
    for (const s of AGENT_SCOPES) {
      if (lower) {
        const hay = `${s.label} ${s.shortDesc}`.toLowerCase();
        if (!hay.includes(lower)) continue;
      }
      out[s.group].push(s);
    }
    return out;
  }, [lower]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const noResults = !grouped.shop.length && !grouped.admin.length && !grouped.shared.length;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          Hangi sayfalar? <span className="text-rose-500">*</span>
        </label>
        <span className="text-[10px] text-[color:var(--color-muted)]/70">
          {selected.length === 0
            ? "en az 1 seç"
            : `${selected.length} seçili`}
        </span>
      </div>

      {/* Search */}
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--color-muted)]/70" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sayfa ara…"
          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] py-2 pl-8 pr-3 text-xs focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20"
        />
      </div>

      <div className="mt-3 space-y-4">
        {noResults && (
          <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-3 py-4 text-center text-xs text-[color:var(--color-muted)]">
            "{q}" için sonuç yok.
          </div>
        )}

        {(["shop", "admin", "shared"] as const).map((g) => {
          const items = grouped[g];
          if (items.length === 0) return null;
          const meta = GROUP_META[g];
          const Icon = meta.icon;
          return (
            <div key={g}>
              <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${meta.accent}`}>
                <Icon className="h-3 w-3" />
                {meta.label}
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {items.map((s) => (
                  <ScopeChip
                    key={s.id}
                    scope={s}
                    selected={selected.includes(s.id)}
                    onClick={() => toggle(s.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden inputs — form submit'e dahil */}
      {selected.map((id) => (
        <input key={id} type="hidden" name="targetScopes" value={id} />
      ))}

      {/* Locked-out info */}
      <div className="mt-3 flex items-start gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-3 py-2 text-[11px] text-[color:var(--color-muted)]">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          Seçili olmayan sayfalar agent'a kapalıdır. Prisma, auth, db.ts, .env her
          zaman korunur — seçsen bile yazılmaz.
        </span>
      </div>
    </div>
  );
}

function ScopeChip({
  scope,
  selected,
  onClick,
}: {
  scope: AgentScope;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
        selected
          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.06] ring-1 ring-[color:var(--color-accent)]/30"
          : "border-[color:var(--color-border)] bg-[color:var(--color-bg)] hover:border-[color:var(--color-fg)]/30 hover:bg-[color:var(--color-fg)]/[0.02]"
      }`}
    >
      <span
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
          selected
            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white"
            : "border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">{scope.label}</span>
        <span className="mt-0.5 block text-[10px] leading-snug text-[color:var(--color-muted)]">
          {scope.shortDesc}
        </span>
      </span>
    </button>
  );
}
