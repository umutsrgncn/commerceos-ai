import { z } from "zod";
import { slugify } from "@/lib/schemas/products";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryCreateSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter").max(80),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(slugRegex, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  description: z.string().max(2000).optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export { slugify };
