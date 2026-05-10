"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Lock,
  ShieldCheck,
  TestTube2,
} from "lucide-react";

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
import {
  updateGibSettingsAction,
  type SettingsActionState,
} from "@/lib/actions/settings";
import { cn } from "@/lib/cn";

type Initial = {
  gibMode: string;
  gibIntegratorUrl: string | null;
  gibUsername: string | null;
  gibPasswordEncrypted: string | null;
  gibSenderAlias: string | null;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton({ ok }: { ok: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        "Kaydediliyor..."
      ) : ok ? (
        <>
          <Check className="h-4 w-4" />
          Kaydedildi
        </>
      ) : (
        "GİB ayarlarını kaydet"
      )}
    </Button>
  );
}

export function GibForm({ initial }: { initial: Initial }) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    updateGibSettingsAction,
    null
  );
  const [mode, setMode] = useState<"test" | "production">(
    initial.gibMode === "production" ? "production" : "test"
  );

  const isProduction = mode === "production";
  const isReady =
    isProduction
      ? !!initial.gibIntegratorUrl && !!initial.gibUsername
      : true;

  return (
    <Card>
      <CardHeader className="border-b border-[color:var(--color-border)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              GİB Entegrasyonu
            </CardTitle>
            <CardDescription>
              UBL-TR 1.2 standartında XML üretilir, entegratöre HTTP POST yapılır.
            </CardDescription>
          </div>
          <ModeIndicator mode={mode} ready={isReady} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Mod karşılaştırma kartları */}
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            value="test"
            active={mode === "test"}
            onClick={() => setMode("test")}
            icon={<TestTube2 className="h-4 w-4 text-amber-500" />}
            title="Test"
            description="Lokal mock yanıt — fatura asla gönderilmez. UI/akış testi için ideal."
            bullets={[
              "Demo amaçlı, gerçek vergi etkisi yok",
              "600ms gecikmeyle ACCEPTED yanıt simüle eder",
              "İmza, sertifika gerekmez",
            ]}
          />
          <ModeCard
            value="production"
            active={mode === "production"}
            onClick={() => setMode("production")}
            icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
            title="Üretim"
            description="Kendi entegratörüne (Foriba/Logo/BIM) gerçek HTTP isteği."
            bullets={[
              "Entegratör URL + kullanıcı adı/şifre gerekli",
              "Sender alias (urn:mail:...)",
              "Şirket vergi numarası dolu olmalı",
            ]}
          />
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-4 rounded-lg border border-[color:var(--color-border)] p-4">
          <input type="hidden" name="gibMode" value={mode} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gibIntegratorUrl">
                Entegratör URL
                {isProduction && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </Label>
              <Input
                id="gibIntegratorUrl"
                name="gibIntegratorUrl"
                type="url"
                defaultValue={initial.gibIntegratorUrl ?? ""}
                placeholder="https://api.foriba.com/efatura/v1/send"
                required={isProduction}
              />
              <FieldError messages={state?.fieldErrors?.gibIntegratorUrl} />
              <p className="text-xs text-[color:var(--color-muted)]">
                Foriba, Logo, BIM, Mikro vb. entegratör API endpoint'i.
                Test modunda bu alan ihmal edilir.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gibUsername" className="flex items-center gap-1.5">
                Kullanıcı adı
                {isProduction && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="gibUsername"
                name="gibUsername"
                defaultValue={initial.gibUsername ?? ""}
                placeholder="firma_user"
                required={isProduction}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gibPasswordEncrypted" className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Şifre
              </Label>
              <Input
                id="gibPasswordEncrypted"
                name="gibPasswordEncrypted"
                type="password"
                defaultValue={initial.gibPasswordEncrypted ?? ""}
                placeholder="••••••••"
              />
              <p className="text-xs text-[color:var(--color-muted)]">
                Demo amaçlı plaintext saklanır; üretimde KMS/Vault kullan.
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="gibSenderAlias">Gönderici Alias</Label>
              <Input
                id="gibSenderAlias"
                name="gibSenderAlias"
                defaultValue={initial.gibSenderAlias ?? ""}
                placeholder="urn:mail:test@firma.com.tr"
                className="font-mono"
              />
              <p className="text-xs text-[color:var(--color-muted)]">
                GİB'in firmanı tanıdığı alias. Genelde{" "}
                <span className="font-mono">urn:mail:</span> ile başlar.
              </p>
            </div>
          </div>

          {/* Bilgi kutusu */}
          {isProduction && (
            <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>
                <strong className="block font-semibold">
                  Üretime almadan önce şunları kontrol et:
                </strong>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  <li>
                    <a
                      href="/admin/settings"
                      className="underline hover:no-underline"
                    >
                      Şirket bilgileri
                    </a>{" "}
                    bölümünde <strong>vergi numarası</strong> dolu mu?
                  </li>
                  <li>Entegratör URL hazırda çalışıyor mu (entegratörün test panel'i)?</li>
                  <li>
                    Kullanıcı adı/şifre <strong>üretim</strong> hesabına ait mi?
                  </li>
                </ul>
              </div>
            </div>
          )}

          {state?.error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {state.error}
            </div>
          )}
          {state?.ok && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
              GİB ayarları güncellendi.
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <a
              href="https://efatura.gov.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
            >
              GİB e-fatura portalı <ExternalLink className="h-3 w-3" />
            </a>
            <SubmitButton ok={!!state?.ok} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ModeIndicator({
  mode,
  ready,
}: {
  mode: "test" | "production";
  ready: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        mode === "test"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : ready
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-red-500/10 text-red-600"
      )}
    >
      {mode === "test" ? (
        <>
          <TestTube2 className="h-3 w-3" />
          Test modu
        </>
      ) : ready ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Üretim — hazır
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          Üretim — eksik
        </>
      )}
    </span>
  );
}

function ModeCard({
  value,
  active,
  onClick,
  icon,
  title,
  description,
  bullets,
}: {
  value: "test" | "production";
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-4 text-left transition",
        active
          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.04] shadow-sm"
          : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30"
      )}
      aria-pressed={active}
    >
      <div className="mb-1.5 flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        {active && (
          <span className="ml-auto rounded-full bg-[color:var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-accent)]">
            Seçili
          </span>
        )}
      </div>
      <p className="text-xs text-[color:var(--color-muted)]">{description}</p>
      <ul className="mt-2 space-y-1 text-[10px] text-[color:var(--color-muted)]">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-1">
            <span>·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <input
        type="radio"
        name="gibMode"
        value={value}
        checked={active}
        onChange={() => onClick()}
        className="sr-only"
      />
    </button>
  );
}
