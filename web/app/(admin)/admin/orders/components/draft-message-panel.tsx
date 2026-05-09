"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  draftCustomerMessage,
  type DraftMessageIntent,
} from "@/lib/actions/ai";

const INTENTS: Array<{ value: DraftMessageIntent; label: string }> = [
  { value: "shipped", label: "Kargo bildirimi" },
  { value: "delayed", label: "Gecikme açıklaması" },
  { value: "thanks", label: "Teşekkür / feedback daveti" },
  { value: "apology", label: "Özür / hatayı düzeltme" },
  { value: "cancelled", label: "İptal bildirimi" },
];

interface Props {
  orderNumber: string;
  customerName: string;
  totalLabel: string;
}

export function DraftMessagePanel({ orderNumber, customerName, totalLabel }: Props) {
  const [intent, setIntent] = useState<DraftMessageIntent>("shipped");
  const [extra, setExtra] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setPending(true);
    setError(null);
    setCopied(false);
    const res = await draftCustomerMessage({
      intent,
      order_number: orderNumber,
      customer_name: customerName,
      total_label: totalLabel,
      extra_context: extra.trim() || undefined,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setText(res.text);
  }

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
          Niyet
        </label>
        <Select
          value={intent}
          onChange={(e) => setIntent(e.target.value as DraftMessageIntent)}
        >
          {INTENTS.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
          Ek bağlam (opsiyonel)
        </label>
        <Textarea
          rows={2}
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Örn. ürün yanlış geldiyse hangisi"
        />
      </div>

      <Button type="button" size="sm" onClick={generate} disabled={pending} className="w-full">
        <Sparkles className="h-3.5 w-3.5" />
        {pending ? "Yazıyor..." : text ? "Yeniden yaz" : "Mesaj öner"}
      </Button>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {error}
        </div>
      )}

      {text && (
        <div className="space-y-2">
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="w-full"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Kopyalandı" : "Panoya kopyala"}
          </Button>
        </div>
      )}
    </div>
  );
}
