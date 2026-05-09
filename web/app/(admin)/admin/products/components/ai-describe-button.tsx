"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProductDescription } from "@/lib/actions/ai";

interface AiDescribeButtonProps {
  getInput: () => {
    name: string;
    sku?: string;
    category?: string | null;
  };
  onResult: (text: string) => void;
}

export function AiDescribeButton({ getInput, onResult }: AiDescribeButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    const input = getInput();
    if (!input.name.trim()) {
      setPending(false);
      setError("Önce ürün adını gir.");
      return;
    }
    const res = await generateProductDescription({
      ...input,
      tone: "professional",
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onResult(res.text);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={run}
        disabled={pending}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {pending ? "Yazıyor..." : "AI ile yaz"}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
