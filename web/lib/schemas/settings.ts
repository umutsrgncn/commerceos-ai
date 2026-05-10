import { z } from "zod";

export const settingsUpdateSchema = z.object({
  companyName: z.string().min(2, "En az 2 karakter").max(120),
  taxId: z.string().max(40).optional().nullable(),
  address: z.string().max(400).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z
    .string()
    .email("Geçerli e-posta gir")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  defaultCurrency: z.enum(["TRY", "USD", "EUR"]),
  defaultTaxRate: z.coerce.number().min(0).max(1),
  timezone: z.string().min(2).max(60),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

/** GİB e-fatura entegrasyon ayarları — ayrı section olarak güncellenir. */
export const gibSettingsSchema = z.object({
  gibMode: z.enum(["test", "production"]),
  gibIntegratorUrl: z
    .string()
    .url("Geçerli URL gir")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  gibUsername: z.string().max(120).optional().nullable(),
  gibPasswordEncrypted: z.string().max(240).optional().nullable(),
  gibSenderAlias: z.string().max(120).optional().nullable(),
});
