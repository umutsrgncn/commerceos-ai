import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "RENT",
  "PAYROLL",
  "SHIPPING",
  "MARKETING",
  "SUPPLIES",
  "COGS",
  "TAXES",
  "UTILITIES",
  "SOFTWARE",
  "TRAVEL",
  "OTHER",
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryValue, string> = {
  RENT: "Kira",
  PAYROLL: "Personel",
  SHIPPING: "Kargo",
  MARKETING: "Pazarlama",
  SUPPLIES: "Ofis/malzeme",
  COGS: "Satılan mal maliyeti",
  TAXES: "Vergi/SGK",
  UTILITIES: "Fatura (elektrik/su/internet)",
  SOFTWARE: "Yazılım/SaaS",
  TRAVEL: "Seyahat",
  OTHER: "Diğer",
};

const amountField = z
  .union([z.string(), z.number()])
  .transform((val, ctx) => {
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

export const expenseCreateSchema = z.object({
  date: z
    .string()
    .min(1, "Tarih gerekli")
    .transform((s) => new Date(s)),
  amount: amountField,
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  category: z.enum(EXPENSE_CATEGORIES).default("OTHER"),
  description: z.string().min(2, "Açıklama en az 2 karakter").max(500),
  vendor: z.string().max(160).optional().nullable(),
  reference: z.string().max(80).optional().nullable(),
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;

export const expenseUpdateSchema = expenseCreateSchema.extend({
  id: z.string().cuid(),
});
