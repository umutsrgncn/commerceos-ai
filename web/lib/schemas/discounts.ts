import { z } from "zod";

export const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type DiscountTypeValue = (typeof DISCOUNT_TYPES)[number];

const codeRegex = /^[A-Z0-9-]{3,40}$/;

const minorMoneyField = z
  .union([z.string(), z.number()])
  .transform((val, ctx) => {
    const num = typeof val === "string" ? Number(val.replace(",", ".")) : val;
    if (!Number.isFinite(num) || num < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pozitif olmalı" });
      return z.NEVER;
    }
    return Math.round(num * 100);
  });

const percentField = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val) || 0)
  .pipe(z.number().min(0).max(100));

const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? new Date(val) : null));

export const discountCreateSchema = z
  .object({
    code: z
      .string()
      .toUpperCase()
      .regex(codeRegex, "Kod 3-40 karakter, büyük harf/rakam/tire"),
    description: z.string().max(200).optional().nullable(),
    type: z.enum(DISCOUNT_TYPES),
    percentValue: percentField.optional(),
    fixedValue: minorMoneyField.optional(),
    minSubtotal: minorMoneyField.optional(),
    maxRedemptions: z
      .union([z.string(), z.number(), z.literal("")])
      .transform((v) => (v === "" || v == null ? null : Number(v) || null))
      .pipe(z.number().int().positive().nullable()),
    startsAt: optionalDate,
    endsAt: optionalDate,
    isActive: z.coerce.boolean().default(true),
  })
  .refine(
    (data) =>
      data.type === "PERCENTAGE" ? data.percentValue !== undefined : true,
    { path: ["percentValue"], message: "Yüzde değeri gerekli" }
  )
  .refine((data) => (data.type === "FIXED" ? data.fixedValue !== undefined : true), {
    path: ["fixedValue"],
    message: "Sabit tutar gerekli",
  })
  .refine(
    (data) => !data.startsAt || !data.endsAt || data.endsAt > data.startsAt,
    { path: ["endsAt"], message: "Bitiş tarihi başlangıçtan sonra olmalı" }
  );

export type DiscountCreateInput = z.infer<typeof discountCreateSchema>;

/** Edit form: id required, code is immutable, geri kalan alanlar değişebilir. */
export const discountUpdateSchema = z
  .object({
    id: z.string().cuid(),
    description: z.string().max(200).optional().nullable(),
    type: z.enum(DISCOUNT_TYPES),
    percentValue: percentField.optional(),
    fixedValue: minorMoneyField.optional(),
    minSubtotal: minorMoneyField.optional(),
    maxRedemptions: z
      .union([z.string(), z.number(), z.literal("")])
      .transform((v) => (v === "" || v == null ? null : Number(v) || null))
      .pipe(z.number().int().positive().nullable()),
    startsAt: optionalDate,
    endsAt: optionalDate,
    isActive: z.coerce.boolean().default(true),
  })
  .refine(
    (data) =>
      data.type === "PERCENTAGE" ? data.percentValue !== undefined : true,
    { path: ["percentValue"], message: "Yüzde değeri gerekli" }
  )
  .refine((data) => (data.type === "FIXED" ? data.fixedValue !== undefined : true), {
    path: ["fixedValue"],
    message: "Sabit tutar gerekli",
  })
  .refine(
    (data) => !data.startsAt || !data.endsAt || data.endsAt > data.startsAt,
    { path: ["endsAt"], message: "Bitiş tarihi başlangıçtan sonra olmalı" }
  );

export type DiscountUpdateInput = z.infer<typeof discountUpdateSchema>;
