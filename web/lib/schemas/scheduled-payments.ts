import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/schemas/expenses";

export const RECURRENCE_RULES = [
  "MONTHLY",
  "WEEKLY",
  "QUARTERLY",
  "YEARLY",
  "ONE_TIME",
] as const;
export type RecurrenceRuleValue = (typeof RECURRENCE_RULES)[number];

export const RECURRENCE_LABELS: Record<RecurrenceRuleValue, string> = {
  MONTHLY: "Aylık",
  WEEKLY: "Haftalık",
  QUARTERLY: "3 aylık",
  YEARLY: "Yıllık",
  ONE_TIME: "Tek seferlik",
};

const amountField = z.union([z.string(), z.number()]).transform((val, ctx) => {
  const num = typeof val === "string" ? Number(val.replace(",", ".")) : val;
  if (!Number.isFinite(num) || num <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tutar pozitif olmalı",
    });
    return z.NEVER;
  }
  return Math.round(num * 100);
});

const dueDayField = z.union([z.string(), z.number()]).transform((val, ctx) => {
  const num = typeof val === "string" ? Number(val) : val;
  if (!Number.isFinite(num) || num < 0 || num > 31) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vade günü 0-31 arası olmalı",
    });
    return z.NEVER;
  }
  return Math.floor(num);
});

const optionalDate = z
  .union([z.string(), z.literal("")])
  .transform((s) => (s ? new Date(s) : null))
  .nullable();

export const scheduledPaymentCreateSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter").max(160),
  amount: amountField,
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  category: z.enum(EXPENSE_CATEGORIES).default("OTHER"),
  recurrence: z.enum(RECURRENCE_RULES).default("MONTHLY"),
  dueDay: dueDayField,
  startDate: z
    .string()
    .min(1, "Başlangıç tarihi gerekli")
    .transform((s) => new Date(s)),
  endDate: optionalDate,
  vendor: z.string().max(160).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  active: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true" || v === "on")
    .default(true),
});
export type ScheduledPaymentCreateInput = z.infer<
  typeof scheduledPaymentCreateSchema
>;

export const scheduledPaymentUpdateSchema = scheduledPaymentCreateSchema.extend({
  id: z.string().cuid(),
});
