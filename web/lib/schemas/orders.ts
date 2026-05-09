import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orders/workflow";

export const orderItemInputSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().positive().max(9999),
});

export const orderCreateSchema = z.object({
  customerId: z.string().cuid(),
  items: z
    .array(orderItemInputSchema)
    .min(1, "En az bir ürün ekle")
    .max(50, "Tek siparişte 50'den fazla kalem olamaz"),
  taxRate: z.coerce.number().min(0).max(0.5).default(0),
  shipping: z.coerce.number().int().min(0).default(0), // minor units
  notes: z.string().max(2000).optional().nullable(),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const orderStatusTransitionSchema = z.object({
  id: z.string().cuid(),
  to: z.enum(ORDER_STATUSES),
});
