import { z } from "zod";

export const ADJUSTMENT_REASONS = [
  "RESTOCK",
  "SALE",
  "RETURN",
  "LOSS",
  "CORRECTION",
] as const;

export type AdjustmentReasonValue = (typeof ADJUSTMENT_REASONS)[number];

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReasonValue, string> = {
  RESTOCK: "Yeni stok girişi",
  SALE: "Satış",
  RETURN: "İade",
  LOSS: "Fire / kayıp",
  CORRECTION: "Manuel düzeltme",
};

export const inventoryAdjustSchema = z.object({
  productId: z.string().cuid(),
  delta: z.coerce
    .number()
    .int("Tam sayı olmalı")
    .refine((n) => n !== 0, "Değişiklik 0 olamaz"),
  reason: z.enum(ADJUSTMENT_REASONS).default("CORRECTION"),
  note: z.string().max(280).optional().nullable(),
});

export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>;

export const reorderLevelSchema = z.object({
  productId: z.string().cuid(),
  reorderLevel: z.coerce.number().int().min(0).max(100000),
});
