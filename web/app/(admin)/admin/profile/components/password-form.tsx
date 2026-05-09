"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  changePasswordAction,
  type ProfileActionState,
} from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-red-500">{messages[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Değiştiriliyor..." : "Şifreyi değiştir"}
    </Button>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    changePasswordAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4" key={state?.ok ? "fresh" : "current"}>
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Mevcut şifre</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state?.fieldErrors?.currentPassword} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Yeni şifre</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError messages={state?.fieldErrors?.newPassword} />
        <p className="text-xs text-[color:var(--color-muted)]">
          En az 8 karakter
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Yeni şifre (tekrar)</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state?.fieldErrors?.confirmPassword} />
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
          Şifre değiştirildi.
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
