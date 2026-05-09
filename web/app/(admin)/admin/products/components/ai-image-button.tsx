"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Style = "studio" | "lifestyle" | "minimal" | "dark";

const STYLES: Array<{ value: Style; label: string; hint: string }> = [
  { value: "studio", label: "Stüdyo", hint: "Beyaz zemin, e-ticaret klasiği" },
  { value: "lifestyle", label: "Yaşam", hint: "Doğal ışık, ahşap yüzey" },
  { value: "minimal", label: "Minimal", hint: "Pastel zemin, geniş boşluk" },
  { value: "dark", label: "Premium", hint: "Karanlık zemin, dramatik" },
];

interface Props {
  /** Reads name/description/category from the form when triggered. */
  getInput: () => {
    name: string;
    description?: string | null;
    category?: string | null;
  };
  /** Called with the URLs persisted under /uploads. */
  onUrls: (urls: string[]) => void;
}

export function AiImageButton({ getInput, onUrls }: Props) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<Style>("studio");
  const [count, setCount] = useState<1 | 2 | 4>(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  async function generate() {
    const input = getInput();
    if (!input.name.trim()) {
      setError("Önce ürün adını gir.");
      return;
    }

    setError(null);
    setPending(true);
    setPreviews([]);
    setLastPrompt(null);

    try {
      const res = await fetch("/api/ai/product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          description: input.description ?? null,
          category: input.category ?? null,
          style,
          count,
        }),
      });

      const data = (await res.json()) as
        | { ok: true; urls: string[]; prompt: string }
        | { ok: false; error: string };

      if (!data.ok) {
        setError(data.error);
        return;
      }
      setPreviews(data.urls);
      setLastPrompt(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata.");
    } finally {
      setPending(false);
    }
  }

  function applyAll() {
    if (previews.length === 0) return;
    onUrls(previews);
    setPreviews([]);
    setOpen(false);
  }

  function applyOne(url: string) {
    onUrls([url]);
    // Kalan diğer önizlemeleri kullanıcı isterse "Hepsini ekle"den koruyabilir.
    setPreviews((prev) => prev.filter((u) => u !== url));
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI ile üret
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="font-semibold">AI ile ürün görseli üret</h3>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                  Imagen 4 · Form alanlarından prompt oluşturulur
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => !pending && setOpen(false)}
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                  Stil
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STYLES.map((s) => {
                    const active = style === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStyle(s.value)}
                        disabled={pending}
                        className={cn(
                          "rounded-lg border p-3 text-left text-xs transition",
                          active
                            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.05]"
                            : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30"
                        )}
                      >
                        <div className="font-medium">{s.label}</div>
                        <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
                          {s.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                  Varyant sayısı
                </div>
                <div className="flex gap-2">
                  {([1, 2, 4] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      disabled={pending}
                      className={cn(
                        "h-9 w-12 rounded-lg border text-sm font-medium transition",
                        count === n
                          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.05]"
                          : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="ml-2 self-center text-xs text-[color:var(--color-muted)]">
                    Daha fazla varyant = daha uzun bekleme süresi
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {previews.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                      Önizleme
                    </span>
                    {lastPrompt && (
                      <span
                        className="line-clamp-1 max-w-md text-[10px] font-mono text-[color:var(--color-muted)]"
                        title={lastPrompt}
                      >
                        {lastPrompt}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {previews.map((url) => (
                      <div
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-[color:var(--color-border)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => applyOne(url)}
                          className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
                        >
                          Bunu ekle
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[color:var(--color-border)] px-6 py-4">
              {previews.length > 0 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPreviews([]);
                      setLastPrompt(null);
                    }}
                  >
                    Yeniden üret
                  </Button>
                  <Button type="button" onClick={applyAll}>
                    Hepsini ürüne ekle ({previews.length})
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    type="button"
                    onClick={generate}
                    disabled={pending}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Üretiliyor…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Görseli üret
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
