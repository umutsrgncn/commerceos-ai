import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orders/workflow";

export const orderItemInputSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().positive().max(9999),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Ad soyad gerekli").max(160),
  phone: z.string().max(40).optional().nullable(),
  line1: z.string().min(3, "Adres satırı gerekli").max(300),
  line2: z.string().max(300).optional().nullable(),
  city: z.string().min(2, "İl gerekli").max(80),
  district: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(15).optional().nullable(),
  country: z.string().default("TR"),
});

export const billingAddressSchema = shippingAddressSchema.extend({
  isCompany: z.coerce.boolean().default(false),
  taxId: z.string().max(20).optional().nullable(),
  taxOffice: z.string().max(120).optional().nullable(),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type BillingAddressInput = z.infer<typeof billingAddressSchema>;

export const orderCreateSchema = z.object({
  customerId: z.string().cuid(),
  items: z
    .array(orderItemInputSchema)
    .min(1, "En az bir ürün ekle")
    .max(50, "Tek siparişte 50'den fazla kalem olamaz"),
  taxRate: z.coerce.number().min(0).max(0.5).default(0),
  shipping: z.coerce.number().int().min(0).default(0), // minor units
  notes: z.string().max(2000).optional().nullable(),
  shippingAddress: shippingAddressSchema.optional().nullable(),
  billingAddress: billingAddressSchema.optional().nullable(),
  billingSameAsShipping: z.coerce.boolean().default(false),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const orderStatusTransitionSchema = z.object({
  id: z.string().cuid(),
  to: z.enum(ORDER_STATUSES),
});
