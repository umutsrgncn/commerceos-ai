"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitDeletionRequestAction } from "@/lib/actions/kvkk";

type State = { ok: boolean; error?: string };
const initial: State = { ok: false };

export function DeletionRequestForm() {
  const [state, action, pending] = useActionState(
    submitDeletionRequestAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4 rounded-xl border border-[color:var(--color-border)] p-4 sm:p-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta *</Label>
        <Input id="email" name="email" type="email" required placeholder="ornek@mail.com" />
        <p className="text-[10px] text-[color:var(--color-muted)]">
          Sistemimizde kayıtlı e-posta adresinizi girin.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Ad Soyad</Label>
        <Input id="name" name="name" placeholder="(opsiyonel)" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Talep nedeni</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={3}
          placeholder="Talebinizin sebebini kısaca belirtin (opsiyonel)"
        />
      </div>

      {state.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Gönderiliyor…
          </>
        ) : (
          <>
            <Trash2 className="h-3.5 w-3.5" />
            Veri silme talebi gönder
          </>
        )}
      </Button>
    </form>
  );
}
