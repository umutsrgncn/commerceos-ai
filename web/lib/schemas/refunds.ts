import { z } from "zod";

export const REFUND_REASONS = [
  "CUSTOMER_REQUEST",
  "DEFECTIVE",
  "WRONG_ITEM",
  "LATE_DELIVERY",
  "CANCELLED",
  "OTHER",
] as const;

export type RefundReasonValue = (typeof REFUND_REASONS)[number];

export const REFUND_REASON_LABELS: Record<RefundReasonValue, string> = {
  CUSTOMER_REQUEST: "Müşteri talebi",
  DEFECTIVE: "Ayıplı ürün",
  WRONG_ITEM: "Yanlış ürün",
  LATE_DELIVERY: "Gecikmiş teslimat",
  CANCELLED: "Sipariş iptali",
  OTHER: "Diğer",
};

const amountField = z
  .union([z.string(), z.number()])
  .transform((val, ctx) => {
    const num = typeof val === "string" ? Number(val.replace(",", ".")) : val;
    if (!Number.isFinite(num) || num <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tutar pozitif olmalı" });
      return z.NEVER;
    }
    return Math.round(num * 100);
  });

export const refundCreateSchema = z.object({
  orderId: z.string().cuid(),
  amount: amountField,
  reason: z.enum(REFUND_REASONS).default("CUSTOMER_REQUEST"),
  notes: z.string().max(2000).optional().nullable(),
});

export type RefundCreateInput = z.infer<typeof refundCreateSchema>;
