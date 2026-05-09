"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCategoryAction,
  type CategoryActionState,
} from "@/lib/actions/categories";

type Option = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="h-4 w-4" />
      {pending ? "Ekleniyor..." : "Ekle"}
    </Button>
  );
}

export function CreateCategoryForm({ parents }: { parents: Option[] }) {
  const [state, formAction] = useActionState<CategoryActionState, FormData>(
    createCategoryAction,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Ad</Label>
          <Input id="name" name="name" required placeholder="Örn. Kıyafet" />
          {state?.fieldErrors?.name && (
            <p className="text-xs text-red-500">{state.fieldErrors.name[0]}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug">Slug (boş bırak otomatik)</Label>
          <Input id="slug" name="slug" placeholder="kiyafet" />
          {state?.fieldErrors?.slug && (
            <p className="text-xs text-red-500">{state.fieldErrors.slug[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="parentId">Üst kategori</Label>
        <Select id="parentId" name="parentId" defaultValue="">
          <option value="">— Yok (kök) —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>

      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
