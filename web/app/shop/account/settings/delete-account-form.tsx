"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requestAccountDeletion } from "./actions";

export type RequestDeletionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export function DeleteAccountForm({ customerId }: { customerId: string }) {
  const [state, formAction] = useActionState<RequestDeletionState, FormData>(
    requestAccountDeletion,
    null,
  );
  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <div>
        <Label htmlFor="reason">Silme nedeni (isteğe bağlı)</Label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Hesabınızı neden silmek istediğinizi belirtin..."
          className="mt-1"
        />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Talep Gönderiliyor..." : "Hesabımı Sil"}
      </Button>
      {state?.ok && (
        <p className="text-sm text-[color:var(--color-success)]">
          {state.message}
        </p>
      )}
      {state?.ok === false && (
        <p className="text-sm text-[color:var(--color-error)]">
          {state.error}
        </p>
      )}
    </form>
  );
}
