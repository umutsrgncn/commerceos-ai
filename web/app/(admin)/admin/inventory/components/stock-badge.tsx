import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StockBadge({
  quantity,
  reorderLevel,
}: {
  quantity: number;
  reorderLevel: number;
}) {
  if (quantity <= 0) {
    return (
      <Badge variant="danger">
        <XCircle className="h-3 w-3" />
        Tükendi
      </Badge>
    );
  }
  if (quantity <= reorderLevel) {
    return (
      <Badge variant="warning">
        <AlertTriangle className="h-3 w-3" />
        Düşük stok
      </Badge>
    );
  }
  return (
    <Badge variant="success">
      <CheckCircle2 className="h-3 w-3" />
      Yeterli
    </Badge>
  );
}
