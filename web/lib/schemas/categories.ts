import { z } from "zod";
import { slugify } from "@/lib/schemas/products";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const imageUrlSchema = z
  .string()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
    "Geçerli URL veya /products/... yolu olmalı",
  )
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const categoryCreateSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter").max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(slugRegex, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: imageUrlSchema,
  parentId: z.string().cuid().optional().nullable(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export { slugify };
