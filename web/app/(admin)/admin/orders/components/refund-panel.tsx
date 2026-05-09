"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createRefundAction,
  markRefundCompletedAction,
  markRefundRejectedAction,
  type RefundActionState,
} from "@/lib/actions/refunds";
import { REFUND_REASONS, REFUND_REASON_LABELS } from "@/lib/schemas/refunds";
import { formatMoney } from "@/lib/format";

type RefundRow = {
  id: string;
  amount: number;
  reason: (typeof REFUND_REASONS)[number];
  status: "PENDING" | "COMPLETED" | "REJECTED";
  notes: string | null;
  createdAt: Date;
};

const STATUS_VARIANT = {
  PENDING: "warning",
  COMPLETED: "success",
  REJECTED: "neutral",
} as const;
const STATUS_LABEL = {
  PENDING: "Beklemede",
  COMPLETED: "Tamamlandı",
  REJECTED: "Reddedildi",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Açılıyor..." : "İade aç"}
    </Button>
  );
}

export function RefundPanel({
  orderId,
  orderTotal,
  currency,
  refundedSoFar,
  refunds,
}: {
  orderId: string;
  orderTotal: number;
  currency: string;
  refundedSoFar: number;
  refunds: RefundRow[];
}) {
  const [state, formAction] = useActionState<RefundActionState, FormData>(
    createRefundAction,
    null
  );
  const [open, setOpen] = useState(false);

  const remaining = orderTotal - refundedSoFar;
  const remainingDisplay = (remaining / 100).toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[color:var(--color-muted)]">Kalan iade hakkı</span>
        <span className="font-mono tabular-nums">
          {formatMoney(remaining, currency)} / {formatMoney(orderTotal, currency)}
        </span>
      </div>

      {refunds.length > 0 && (
        <ul className="space-y-2">
          {refunds.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-2 rounded-md border border-[color:var(--color-border)] p-3 text-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {formatMoney(r.amount, currency)}
                  </span>
                  <Badge variant={STATUS_VARIANT[r.status]}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </div>
                <div className="text-xs text-[color:var(--color-muted)]">
                  {REFUND_REASON_LABELS[r.reason]} · {r.createdAt.toLocaleDateString("tr-TR")}
                </div>
                {r.notes && (
                  <div className="mt-1 text-xs whitespace-pre-wrap">{r.notes}</div>
                )}
              </div>

              {r.status === "PENDING" && (
                <div className="flex flex-col gap-1">
                  <form action={markRefundCompletedAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="orderId" value={orderId} />
                    <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">
                      Tamamla
                    </Button>
                  </form>
                  <form action={markRefundRejectedAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="orderId" value={orderId} />
                    <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      Reddet
                    </Button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 ? (
        open ? (
          <form action={formAction} className="space-y-2 rounded-md border border-[color:var(--color-border)] p-3">
            <input type="hidden" name="orderId" value={orderId} />

            <div className="space-y-1">
              <Label htmlFor="amount">Tutar</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                defaultValue={remainingDisplay}
                required
              />
              {state?.fieldErrors?.amount && (
                <p className="text-xs text-red-500">
                  {state.fieldErrors.amount[0]}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="reason">Sebep</Label>
              <Select id="reason" name="reason" defaultValue="CUSTOMER_REQUEST">
                {REFUND_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {REFUND_REASON_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Not (opsiyonel)</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>

            <div className="flex gap-2">
              <SubmitButton />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Vazgeç
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="w-full"
          >
            İade başlat
          </Button>
        )
      ) : (
        <p className="text-xs text-[color:var(--color-muted)]">
          Tutar tamamen iade edildi.
        </p>
      )}
    </div>
  );
}
