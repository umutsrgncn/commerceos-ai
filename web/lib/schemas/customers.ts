import { z } from "zod";

const phoneRegex = /^[+\d\s\-()]{6,30}$/;

const addressSchema = z
  .object({
    line1: z.string().max(200).optional(),
    line2: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(80).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(80).optional(),
  })
  .partial()
  .optional()
  .nullable();

export const customerCreateSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter").max(120),
  email: z.string().email("Geçerli bir e-posta gir"),
  phone: z
    .string()
    .regex(phoneRegex, "Geçerli bir telefon yaz")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  notes: z.string().max(2000).optional().nullable(),
  address: addressSchema,
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
