"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { simulateBankTransferAction } from "@/lib/actions/bank";

export function SimulatorPanel() {
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function send() {
    setFeedback(null);
    const f = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(f) || f <= 0) {
      setFeedback({ ok: false, message: "Tutar pozitif olmalı." });
      return;
    }
    const minor = Math.round(f * 100);
    start(async () => {
      const r = await simulateBankTransferAction({
        amountMinor: minor,
        description: description.trim() || "Test havalesi",
        customerName: customerName.trim() || undefined,
      });
      if (r.ok) {
        setFeedback({
          ok: true,
          message:
            "Test havalesi banka tablosuna yazıldı, AI eşleştirme denenti. Listeyi yenile.",
        });
        setAmount("");
        setDescription("");
        setCustomerName("");
      } else {
        setFeedback({ ok: false, message: r.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-fuchsia-500" />
          Test Bankası — Havale simülatörü
        </CardTitle>
        <CardDescription>
          Production'da bu yer banka webhook URL'i olacak (BDDK lisansı sonrası
          plug-in). Şimdilik fake havale üretip AI eşleştirmenin çalıştığını
          gösterir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sim-amount">Tutar (₺)</Label>
            <Input
              id="sim-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1234.56"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sim-customer">Müşteri adı (ops.)</Label>
            <Input
              id="sim-customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ahmet Yılmaz"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-desc">Açıklama (havale notu)</Label>
          <Input
            id="sim-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ORD-2026-001 sipariş ödemesi"
          />
        </div>

        <Button
          type="button"
          onClick={send}
          disabled={pending}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Gönderiliyor + AI eşleştiriyor...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Test havalesi gönder
            </>
          )}
        </Button>

        {feedback && (
          <div
            className={
              "rounded-md border p-2 text-xs " +
              (feedback.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-500")
            }
          >
            {feedback.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
