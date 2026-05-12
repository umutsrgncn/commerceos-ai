"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Takip numarasını kopyala"
      title={copied ? "Kopyalandı!" : "Kopyala"}
      className="grid h-7 w-7 place-items-center rounded-md text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06] hover:text-[color:var(--color-accent)]"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
