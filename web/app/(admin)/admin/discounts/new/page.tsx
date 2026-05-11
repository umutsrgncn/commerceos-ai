"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import {
  DiscountForm,
  type DiscountPrefill,
} from "../components/discount-form";
import { DiscountAiSuggestPanel } from "../components/ai-suggest-panel";

export default function NewDiscountPage() {
  const [prefill, setPrefill] = useState<DiscountPrefill | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/discounts"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> İndirimler
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Yeni indirim kodu</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Tip seçince ilgili değer alanı görünür. Sağdaki <strong>AI ile öner</strong> panelinden
          tek tıkla kod, oran ve süre öneri al.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <DiscountForm
            key={formKey}
            mode="create"
            prefill={prefill}
          />
        </div>

        <aside className="lg:sticky lg:top-20 self-start">
          <DiscountAiSuggestPanel
            onApply={(s) => {
              setPrefill({
                code: s.code,
                description: s.description,
                type: s.type,
                value: s.value,
                minSubtotalMinor: s.minSubtotalMinor,
                daysFromNow: s.days,
              });
              // Form'u re-mount et: defaultValue'lar yeni prefill'i alsın
              setFormKey((k) => k + 1);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
