"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, Image as ImageIcon, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface ImageUploaderProps {
  name: string;
  initial?: string[];
}

export function ImageUploader({ name, initial = [] }: ImageUploaderProps) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    const toUpload = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (toUpload.length === 0) return;
    setBusy(true);
    try {
      const form = new FormData();
      toUpload.forEach((f) => form.append("file", f));
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as
        | { ok: true; urls: string[] }
        | { ok: false; error: string };
      if (!data.ok) {
        setError(data.error);
      } else {
        setUrls((prev) => [...prev, ...data.urls]);
      }
    } catch {
      setError("Yükleme başarısız.");
    } finally {
      setBusy(false);
    }
  }

  function remove(idx: number) {
    setUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  function reorder(from: number, to: number) {
    setUrls((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      <div
        ref={dropRef}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition",
          hover
            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.04]"
            : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <UploadCloud className="h-8 w-8 text-[color:var(--color-muted)]" />
        <div className="text-sm">
          <span className="font-medium">Sürükle & bırak</span>
          <span className="text-[color:var(--color-muted)]"> veya tıkla</span>
        </div>
        <div className="text-xs text-[color:var(--color-muted)]">
          PNG, JPG, WebP, AVIF — 5MB&apos;a kadar
        </div>
      </div>

      {busy && (
        <p className="text-xs text-[color:var(--color-muted)]">
          Yükleniyor…
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
          {error}
        </p>
      )}

      {urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((url, idx) => (
            <div
              key={url}
              draggable
              onDragStart={() => setDraggedFrom(idx)}
              onDragEnd={() => setDraggedFrom(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedFrom !== null && draggedFrom !== idx) {
                  reorder(draggedFrom, idx);
                }
                setDraggedFrom(null);
              }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.04]",
                draggedFrom === idx && "opacity-40"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image
                src={url}
                alt={`Görsel ${idx + 1}`}
                width={200}
                height={200}
                className="h-full w-full object-cover"
                unoptimized
              />
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Kapak
                </span>
              )}
              <span className="absolute right-1 top-1 grid h-5 w-5 cursor-grab place-items-center rounded bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                <GripVertical className="h-3 w-3" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(idx);
                }}
                aria-label="Kaldır"
                className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded bg-red-500/80 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length === 0 && !busy && (
        <p className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
          <ImageIcon className="h-3 w-3" />
          Henüz görsel yok. İlki kapak olarak gözükür.
        </p>
      )}
    </div>
  );
}
