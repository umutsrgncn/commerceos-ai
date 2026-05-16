"use client";

import { useRef, useState } from "react";
import { Loader2, Sparkles, Upload, X, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Style = "studio" | "lifestyle" | "minimal" | "dark";
type Tab = "prompt" | "upload";

const STYLES: Array<{ value: Style; label: string; hint: string }> = [
  { value: "studio", label: "Stüdyo", hint: "Beyaz zemin, e-ticaret klasiği" },
  { value: "lifestyle", label: "Yaşam", hint: "Doğal ışık, ahşap yüzey" },
  { value: "minimal", label: "Minimal", hint: "Pastel zemin, geniş boşluk" },
  { value: "dark", label: "Premium", hint: "Karanlık zemin, dramatik" },
];

interface Props {
  getInput: () => {
    name: string;
    description?: string | null;
    category?: string | null;
  };
  onUrls: (urls: string[]) => void;
}

export function AiImageButton({ getInput, onUrls }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("prompt");
  const [style, setStyle] = useState<Style>("studio");
  const [count, setCount] = useState<1 | 2 | 4>(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  // Upload tab state
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [extraHint, setExtraHint] = useState("");
  const [analyzed, setAnalyzed] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function resetAll() {
    setError(null);
    setPreviews([]);
    setLastPrompt(null);
    setAnalyzed(null);
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => {
      const merged = [...prev, ...incoming].slice(0, 4);
      // revoke + yeni URL'ler
      setFilePreviews((old) => {
        old.forEach((u) => URL.revokeObjectURL(u));
        return merged.map((f) => URL.createObjectURL(f));
      });
      return merged;
    });
  }

  function removeFile(idx: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setFilePreviews((old) => {
        URL.revokeObjectURL(old[idx]);
        return old.filter((_, i) => i !== idx);
      });
      return next;
    });
  }

  function closeModal() {
    if (pending) return;
    filePreviews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setFilePreviews([]);
    setExtraHint("");
    resetAll();
    setOpen(false);
  }

  async function generateFromPrompt() {
    const input = getInput();
    if (!input.name.trim()) {
      setError("Önce ürün adını gir.");
      return;
    }
    resetAll();
    setPending(true);
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

  async function improveFromUpload() {
    if (files.length === 0) {
      setError("En az 1 fotoğraf yükle.");
      return;
    }
    resetAll();
    setPending(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("style", style);
      fd.append("count", String(count));
      if (extraHint.trim()) fd.append("extra_hint", extraHint.trim());
      const res = await fetch("/api/ai/improve-image", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as
        | { ok: true; urls: string[]; prompt: string; analyzed: string }
        | { ok: false; error: string };
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setPreviews(data.urls);
      setLastPrompt(data.prompt);
      setAnalyzed(data.analyzed);
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
    closeModal();
  }

  function applyOne(url: string) {
    onUrls([url]);
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
            onClick={closeModal}
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="font-semibold">AI ile ürün görseli</h3>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                  Imagen 4 · Promptan üret veya yüklediğin fotoyu iyileştir
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeModal}
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[color:var(--color-border)] px-4">
              <TabButton active={tab === "prompt"} onClick={() => { setTab("prompt"); resetAll(); }}>
                <Sparkles className="h-3.5 w-3.5" />
                Promptan üret
              </TabButton>
              <TabButton active={tab === "upload"} onClick={() => { setTab("upload"); resetAll(); }}>
                <Upload className="h-3.5 w-3.5" />
                Fotomu iyileştir
              </TabButton>
            </div>

            <div className="space-y-5 p-6">
              {tab === "upload" && (
                <UploadDropzone
                  files={files}
                  filePreviews={filePreviews}
                  fileInputRef={fileInputRef}
                  pending={pending}
                  onAdd={addFiles}
                  onRemove={removeFile}
                  extraHint={extraHint}
                  setExtraHint={setExtraHint}
                />
              )}

              {/* Style */}
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
                            : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30",
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

              {/* Count */}
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
                          : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="ml-2 self-center text-xs text-[color:var(--color-muted)]">
                    Daha fazla varyant = daha uzun bekleme
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {analyzed && tab === "upload" && (
                <div className="rounded-md border border-indigo-500/20 bg-indigo-500/[0.05] p-3 text-xs">
                  <div className="mb-1 font-semibold text-indigo-600 dark:text-indigo-300">
                    AI fotoğraftan çıkardı:
                  </div>
                  <div className="font-mono text-[11px] leading-relaxed text-[color:var(--color-fg)]/80">
                    {analyzed}
                  </div>
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

            {/* Actions */}
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
                    onClick={closeModal}
                    disabled={pending}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    type="button"
                    onClick={tab === "prompt" ? generateFromPrompt : improveFromUpload}
                    disabled={pending}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tab === "upload" ? "Analiz + üretim…" : "Üretiliyor…"}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {tab === "upload" ? "Foto'dan iyileştir" : "Görseli üret"}
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
        active
          ? "border-[color:var(--color-accent)] text-[color:var(--color-fg)]"
          : "border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]",
      )}
    >
      {children}
    </button>
  );
}

function UploadDropzone({
  files,
  filePreviews,
  fileInputRef,
  pending,
  onAdd,
  onRemove,
  extraHint,
  setExtraHint,
}: {
  files: File[];
  filePreviews: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  pending: boolean;
  onAdd: (list: FileList | File[]) => void;
  onRemove: (idx: number) => void;
  extraHint: string;
  setExtraHint: (s: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files) onAdd(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition cursor-pointer",
          dragging
            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.05]"
            : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30",
        )}
      >
        <ImageIcon className="h-6 w-6 text-[color:var(--color-muted)]" />
        <div className="text-sm font-medium">
          Fotoğraf sürükle veya <span className="text-[color:var(--color-accent)] underline">seç</span>
        </div>
        <div className="text-[10px] text-[color:var(--color-muted)]">
          Max 4 dosya · her biri 8 MB · JPEG / PNG / WebP
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={pending}
          onChange={(e) => {
            if (e.target.files) onAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {filePreviews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {filePreviews.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border border-[color:var(--color-border)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={files[i]?.name ?? ""} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                disabled={pending}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Kaldır"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100">
                {(files[i]?.size ?? 0) > 0 ? `${Math.round((files[i].size / 1024 / 1024) * 10) / 10} MB` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
          Ek bilgi (opsiyonel)
        </label>
        <input
          type="text"
          value={extraHint}
          onChange={(e) => setExtraHint(e.target.value)}
          disabled={pending}
          maxLength={500}
          placeholder="örn: 'lacivert nakış görünsün' veya 'altın detayları belirgin'"
          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20"
        />
      </div>
    </div>
  );
}
