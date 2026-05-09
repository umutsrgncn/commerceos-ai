"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  adjustInventoryAction,
  type InventoryActionState,
} from "@/lib/actions/inventory";
import {
  ADJUSTMENT_REASONS,
  ADJUSTMENT_REASON_LABELS,
} from "@/lib/schemas/inventory";

function ApplyButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "..." : "Uygula"}
    </Button>
  );
}

export function AdjustForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState<InventoryActionState, FormData>(
    adjustInventoryAction,
    null
  );
  const [delta, setDelta] = useState("0");

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setDelta((d) => String((Number(d) || 0) - 1))}
          aria-label="-1"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          name="delta"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          inputMode="numeric"
          className="h-9 w-16 text-center font-mono"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setDelta((d) => String((Number(d) || 0) + 1))}
          aria-label="+1"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Select name="reason" defaultValue="CORRECTION" className="h-9 text-xs">
        {ADJUSTMENT_REASONS.map((reason) => (
          <option key={reason} value={reason}>
            {ADJUSTMENT_REASON_LABELS[reason]}
          </option>
        ))}
      </Select>

      <Input
        name="note"
        placeholder="Not (opsiyonel)"
        className="h-9 text-xs"
      />

      <ApplyButton />

      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      {state?.fieldErrors?.delta && (
        <p className="text-xs text-red-500">{state.fieldErrors.delta[0]}</p>
      )}
    </form>
  );
}
