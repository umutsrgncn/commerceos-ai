"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={copy}>
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Kopyalandı
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          XML'i kopyala
        </>
      )}
    </Button>
  );
}
