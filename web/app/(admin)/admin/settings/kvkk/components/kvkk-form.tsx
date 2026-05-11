"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

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
  generatePrivacyPolicyAction,
  updateKvkkSettingsAction,
} from "@/lib/actions/kvkk";

type Initial = {
  cookieBannerEnabled: boolean;
  dataController: string | null;
  dpoEmail: string | null;
  privacyPolicyText: string | null;
  privacyPolicyUpdatedAt: Date | null;
};

type State = { ok: boolean; error?: string };
const initial: State = { ok: false };

export function KvkkForm({ initial: data }: { initial: Initial }) {
  const [state, action, pending] = useActionState(
    updateKvkkSettingsAction,
    initial,
  );
  const [text, setText] = useState(data.privacyPolicyText ?? "");
  const [generating, startGen] = useTransition();
  const [genError, setGenError] = useState<string | null>(null);

  function generate() {
    setGenError(null);
    startGen(async () => {
      const r = await generatePrivacyPolicyAction();
      if (r.ok) {
        setText(r.text);
      } else {
        setGenError(r.error);
      }
    });
  }

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Çerez bildirimi</CardTitle>
          <CardDescription>
            Public sayfalarda (login, /privacy) çerez onay banner'ı gösterilir.
            Kullanıcı kabul edince localStorage'a kaydedilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] p-3 cursor-pointer hover:bg-[color:var(--color-fg)]/[0.03]">
            <input
              type="checkbox"
              name="cookieBannerEnabled"
              defaultChecked={data.cookieBannerEnabled}
              className="h-4 w-4 accent-fuchsia-500"
            />
            <div>
              <div className="text-sm font-medium">
                Çerez banner'ını göster
              </div>
              <p className="text-xs text-[color:var(--color-muted)]">
                Kapatırsan banner gösterilmez. KVKK m.5/2-c uyumluluğu için
                açık tutulması önerilir.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Veri sorumlusu</CardTitle>
          <CardDescription>
            KVKK m.10 — aydınlatma metninde gösterilen iletişim bilgileri.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dataController">Veri sorumlusu (ünvan)</Label>
            <Input
              id="dataController"
              name="dataController"
              defaultValue={data.dataController ?? ""}
              placeholder="ABC Ticaret A.Ş."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dpoEmail">KVKK irtibat e-postası</Label>
            <Input
              id="dpoEmail"
              name="dpoEmail"
              type="email"
              defaultValue={data.dpoEmail ?? ""}
              placeholder="kvkk@sirket.com"
            />
            <p className="text-[10px] text-[color:var(--color-muted)]">
              Veri silme/erişim talepleri bu adrese yönlendirilir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Aydınlatma metni</CardTitle>
            <CardDescription>
              /privacy sayfasında gösterilir. Boş bırakılırsa şirket bilgisinden
              dolduran şablon kullanılır. AI ile dolu metin üretebilirsin.
            </CardDescription>
            {data.privacyPolicyUpdatedAt && (
              <p className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                Son güncelleme:{" "}
                {new Date(data.privacyPolicyUpdatedAt).toLocaleString("tr-TR")}
              </p>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={generate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Üretiliyor…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                AI ile üret
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {genError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
              {genError}
            </div>
          )}
          <Textarea
            name="privacyPolicyText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={20}
            placeholder="Boş bırak şablon kullanılsın, ya da AI üret butonuna bas."
            className="font-mono text-xs"
          />
        </CardContent>
      </Card>

      {state.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {state.ok && !pending && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            Kaydedildi
          </span>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
