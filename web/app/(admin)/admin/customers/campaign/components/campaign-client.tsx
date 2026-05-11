"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  draftCampaignAction,
  sendCampaignAction,
} from "@/lib/actions/email-campaign";
import {
  SEGMENTS,
  SEGMENT_LABELS,
  type Segment,
} from "@/lib/email/constants";
import { cn } from "@/lib/cn";

const SEGMENT_TONE: Record<Segment, string> = {
  "sadık": "border-emerald-500/40 bg-emerald-500/[0.04]",
  VIP: "border-fuchsia-500/40 bg-fuchsia-500/[0.04]",
  yeni: "border-indigo-500/40 bg-indigo-500/[0.04]",
  risky: "border-amber-500/40 bg-amber-500/[0.04]",
  all: "border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02]",
};

const INTENT_PRESETS = [
  "Yaz indirimi kampanyası",
  "Yeni koleksiyon tanıtımı",
  "Geri kazanım — son 60 günde alışveriş yapmadın",
  "Sadakat program davetiye",
  "Doğum günü teklifi",
];

export function CampaignClient({
  initialCounts,
}: {
  initialCounts: Record<Segment, number>;
}) {
  const [segment, setSegment] = useState<Segment>("sadık");
  const [intent, setIntent] = useState(INTENT_PRESETS[0]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPct, setDiscountPct] = useState<string>("");
  const [extraContext, setExtraContext] = useState("");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [drafting, startDraft] = useTransition();
  const [sending, startSend] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);

  function draft() {
    setError(null);
    setSendResult(null);
    startDraft(async () => {
      const r = await draftCampaignAction({
        segment,
        intent,
        discountCode: discountCode.trim() || undefined,
        discountPct: discountPct ? parseInt(discountPct, 10) : undefined,
        extraContext: extraContext.trim() || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSubject(r.subject);
      setBody(r.body);
    });
  }

  function send() {
    setError(null);
    setSendResult(null);
    startSend(async () => {
      const r = await sendCampaignAction({
        segment,
        subject,
        body,
        campaignTag: `${segment}-${Date.now().toString(36)}`,
      });
      if (!r.ok) {
        setError(r.error ?? "Hata");
        return;
      }
      setSendResult({ sent: r.sent ?? 0, failed: r.failed ?? 0 });
    });
  }

  const targetCount = initialCounts[segment] ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      {/* Sol: form */}
      <div className="space-y-4">
        {/* Segment seçim — büyük renkli kartlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-indigo-500" />
              Hedef segment
            </CardTitle>
            <CardDescription>
              Kampanyayı hangi müşteri grubuna göndereceksin?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SEGMENTS.map((s) => {
                const count = initialCounts[s] ?? 0;
                const active = segment === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSegment(s)}
                    className={cn(
                      "rounded-lg border-2 p-3 text-left transition",
                      active
                        ? SEGMENT_TONE[s]
                        : "border-transparent bg-[color:var(--color-fg)]/[0.02] hover:bg-[color:var(--color-fg)]/[0.04]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {SEGMENT_LABELS[s]}
                      </span>
                      <span className="rounded-full bg-[color:var(--color-fg)]/[0.08] px-1.5 py-0.5 text-[10px] tabular-nums">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Amaç + indirim kodu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kampanya amacı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="intent">Amaç</Label>
              <Input
                id="intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Yaz indirimi"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {INTENT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setIntent(p)}
                    className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5 text-[10px] hover:bg-[color:var(--color-fg)]/[0.06]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="discountCode">İndirim kodu (opsiyonel)</Label>
                <Input
                  id="discountCode"
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value.toUpperCase())
                  }
                  placeholder="YAZ25"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discountPct">İndirim oranı (%)</Label>
                <Input
                  id="discountPct"
                  type="number"
                  min={1}
                  max={100}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extraContext">
                Ek bilgi / kişiselleştirme (opsiyonel)
              </Label>
              <Textarea
                id="extraContext"
                rows={2}
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="Bu sezon yeni gelen pamuklu tişörtler vurgu olsun"
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={draft}
              disabled={drafting}
              className="w-full"
            >
              {drafting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  AI yazıyor...
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  AI ile içerik üret
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Editable email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-fuchsia-500" />
              Email içeriği
            </CardTitle>
            <CardDescription>
              AI önerisini düzenleyebilirsin, sonra gönder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Konu</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="AI içerik üret butonuna tıkla..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">İçerik</Label>
              <Textarea
                id="body"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="AI içerik buraya gelecek..."
                className="font-sans leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sağ: özet + gönder paneli */}
      <aside className="space-y-3 lg:sticky lg:top-20 self-start">
        <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/[0.05] to-indigo-500/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              Gönderim özeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3">
              <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Hedef segment
              </div>
              <div className="mt-1 text-lg font-semibold">
                {SEGMENT_LABELS[segment]}
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                {targetCount} müşteriye gönderilecek
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                {error}
              </div>
            )}

            {sendResult && (
              <div className="space-y-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Gönderildi!
                </div>
                <div className="text-xs text-[color:var(--color-muted)]">
                  {sendResult.sent} email gönderildi
                  {sendResult.failed > 0
                    ? `, ${sendResult.failed} başarısız`
                    : ""}
                  . CustomerEmail tablosuna log düştü.
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={send}
              disabled={sending || !subject || !body || targetCount === 0}
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  {targetCount} kişiye gönder
                </>
              )}
            </Button>

            <p className="text-[10px] text-[color:var(--color-muted)]">
              <strong>Mock SMTP:</strong> Email gerçekten gönderilmez,
              CustomerEmail tablosuna log düşer. Gerçek SMTP entegrasyonu
              için sadece <code>sendCampaignAction</code> içine
              SendGrid/Mailgun çağrısı eklemen yeterli.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
