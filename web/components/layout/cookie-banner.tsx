"use client";

/**
 * KVKK uyumlu çerez bilgilendirme banner'ı.
 *
 * localStorage'da onay saklanır. 'Kabul ediyorum' / 'Sadece zorunlu'
 * seçenekleri var. KVKK Madde 5 — açık rıza.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "commerceos:cookie-consent-v1";

type Consent = {
  ts: number;
  level: "essential" | "all";
};

export function CookieBanner({ enabled }: { enabled: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setShow(true);
      }
    } catch {
      setShow(true);
    }
  }, [enabled]);

  function consent(level: "essential" | "all") {
    try {
      const v: Consent = { ts: Date.now(), level };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch {}
    setShow(false);
  }

  if (!enabled || !show) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md z-[80] animate-in slide-in-from-bottom-4 fade-in-50 duration-300">
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
            <Cookie className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold">Çerez kullanımı</h3>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              Sitenin çalışması için zorunlu çerezleri kullanırız.
              Analitik ve performans çerezleri için onayınız gerekir.{" "}
              <Link
                href="/privacy"
                className="text-fuchsia-600 hover:underline dark:text-fuchsia-400"
              >
                Aydınlatma metni
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => consent("essential")}
              >
                Sadece zorunlu
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => consent("all")}
              >
                Tümünü kabul et
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => consent("essential")}
            className="rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06]"
            aria-label="Kapat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
