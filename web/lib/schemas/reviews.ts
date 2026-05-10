import { z } from "zod";

export const reviewCreateSchema = z.object({
  productId: z.string().cuid(),
  authorName: z.string().min(2, "Ad en az 2 karakter").max(120),
  authorEmail: z
    .string()
    .email("Geçerli bir e-posta gir")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  rating: z.coerce.number().int().min(1, "1-5 arası puan").max(5, "1-5 arası puan"),
  body: z.string().min(10, "Yorum en az 10 karakter").max(2000),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
