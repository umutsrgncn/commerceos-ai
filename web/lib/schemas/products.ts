import { z } from "zod";

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuRegex = /^[A-Z0-9-]{2,40}$/;

/** Accepts "1234.56" (display) and converts to integer minor units (123456). */
const priceField = z
  .union([z.string(), z.number()])
  .transform((val, ctx) => {
    const num = typeof val === "string" ? Number(val.replace(",", ".")) : val;
    if (!Number.isFinite(num) || num < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fiyat 0 veya pozitif olmalı",
      });
      return z.NEVER;
    }
    return Math.round(num * 100);
  });

const imagesField = z
  .union([z.array(z.string().url()), z.string()])
  .transform((val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string") : [];
    } catch {
      return [];
    }
  })
  .pipe(z.array(z.string()).max(20))
  .default([]);

export const productCreateSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter").max(160),
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(slugRegex, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  sku: z.string().regex(skuRegex, "SKU 2-40 karakter, büyük harf/rakam/tire"),
  description: z.string().max(8000).optional().nullable(),
  price: priceField,
  costPrice: z
    .union([z.string(), z.number(), z.literal(""), z.null()])
    .transform((val, ctx) => {
      if (val === "" || val === null || val === undefined) return null;
      const num =
        typeof val === "string" ? Number(val.replace(",", ".")) : val;
      if (!Number.isFinite(num) || num < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Maliyet 0 veya pozitif olmalı",
        });
        return z.NEVER;
      }
      return Math.round(num * 100);
    })
    .nullable()
    .optional(),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  status: z.enum(PRODUCT_STATUSES).default("DRAFT"),
  categoryId: z.string().cuid().optional().nullable(),
  images: imagesField,
  initialQuantity: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val) || 0)
    .pipe(z.number().int().nonnegative())
    .optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

/** Converts integer minor units (kuruş) back to a display string ("1234.56"). */
export function formatMinorUnits(amount: number): string {
  return (amount / 100).toFixed(2);
}
