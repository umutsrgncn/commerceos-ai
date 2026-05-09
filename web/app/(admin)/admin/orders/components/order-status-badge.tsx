import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { statusLabel, statusVariant } from "@/lib/orders/workflow";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>;
}
