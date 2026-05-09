"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton({ ok }: { ok: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Kaydediliyor..." : ok ? <><Check className="h-4 w-4" /> Kaydedildi</> : "Kaydet"}
    </Button>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string };
}) {
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    updateProfileAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Ad Soyad</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initial.email}
          required
        />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
          Bilgiler güncellendi.
        </div>
      )}

      <SubmitButton ok={!!state?.ok} />
    </form>
  );
}
