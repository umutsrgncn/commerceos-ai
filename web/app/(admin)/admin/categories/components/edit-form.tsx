"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  updateCategoryAction,
  type CategoryActionState,
} from "@/lib/actions/categories";

type Initial = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
};

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

export function EditCategoryForm({
  initial,
  parents,
}: {
  initial: Initial;
  parents: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<CategoryActionState, FormData>(
    updateCategoryAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={initial.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Ad</Label>
          <Input id="name" name="name" defaultValue={initial.name} required />
          <FieldError messages={state?.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={initial.slug} required />
          <FieldError messages={state?.fieldErrors?.slug} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="parentId">Üst kategori</Label>
        <Select
          id="parentId"
          name="parentId"
          defaultValue={initial.parentId ?? ""}
        >
          <option value="">— Yok (kök) —</option>
          {parents
            .filter((p) => p.id !== initial.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
        <p className="text-xs text-[color:var(--color-muted)]">
          Kategori kendi alt kategorilerinden birinin altına taşınamaz.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial.description ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Kategori görseli (URL veya yol)</Label>
        <div className="flex gap-3">
          {initial.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={initial.imageUrl}
              alt={initial.name}
              className="h-16 w-16 shrink-0 rounded-md border border-[color:var(--color-border)] object-cover"
            />
          )}
          <Input
            id="imageUrl"
            name="imageUrl"
            defaultValue={initial.imageUrl ?? ""}
            placeholder="/categories/tisort.jpg veya https://..."
          />
        </div>
        <FieldError messages={state?.fieldErrors?.imageUrl} />
        <p className="text-xs text-[color:var(--color-muted)]">
          Shop ana sayfada bu görsel kullanılır. Yerel: <code>/categories/&lt;slug&gt;.jpg</code>.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {state.error}
        </div>
      )}

      <SubmitButton ok={state !== null && !state.error && !state.fieldErrors} />
    </form>
  );
}
