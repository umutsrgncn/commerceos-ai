"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Package,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  CARRIERS,
  CARRIER_LABELS,
  markDeliveredAction,
  shipOrderAction,
  type Carrier,
} from "@/lib/actions/shipping";

const CARRIER_COLORS: Record<Carrier, string> = {
  ARAS: "bg-orange-500",
  YURTICI: "bg-blue-500",
  MNG: "bg-red-500",
  PTT: "bg-yellow-600",
  OTHER: "bg-gray-500",
};

type Props = {
  orderId: string;
  status: string;
  carrier: Carrier | null;
  trackingNumber: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
};

export function ShippingCard(props: Props) {
  const [pending, start] = useTransition();
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>("ARAS");
  const [error, setError] = useState<string | null>(null);

  function ship() {
    setError(null);
    start(async () => {
      const r = await shipOrderAction({
        orderId: props.orderId,
        carrier: selectedCarrier,
      });
      if (!r.ok) setError(r.error);
    });
  }

  function markDelivered() {
    setError(null);
    start(async () => {
      const r = await markDeliveredAction(props.orderId);
      if (!r.ok) setError(r.error ?? "Hata");
    });
  }

  // Hiç kargolanmamış (CONFIRMED veya PENDING) → kargo ver butonu
  if (!props.carrier && !props.trackingNumber) {
    if (props.status === "DELIVERED" || props.status === "CANCELLED") {
      return null;
    }
    return (
      <div className="space-y-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-indigo-500" />
          Kargo
        </div>
        <p className="text-xs text-[color:var(--color-muted)]">
          Sipariş hazırlandıktan sonra kargo firmasını seç ve gönder.
        </p>
        <Select
          value={selectedCarrier}
          onChange={(e) => setSelectedCarrier(e.target.value as Carrier)}
        >
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {CARRIER_LABELS[c]}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={ship}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Kargoya veriliyor...
            </>
          ) : (
            <>
              <Truck className="h-3.5 w-3.5" />
              Kargoya ver
            </>
          )}
        </Button>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }

  // Kargolanmış — durumu göster
  const isDelivered = !!props.deliveredAt || props.status === "DELIVERED";
  const carrier = props.carrier as Carrier;
  const trackingUrl =
    props.trackingNumber
      ? `https://example.com/track/${carrier.toLowerCase()}/${props.trackingNumber}`
      : null;

  return (
    <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        {isDelivered ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Teslim edildi
          </>
        ) : (
          <>
            <Truck className="h-4 w-4" />
            Kargoda
          </>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-block h-2.5 w-2.5 rounded-full " + CARRIER_COLORS[carrier]
            }
          />
          <span className="font-medium">{CARRIER_LABELS[carrier]}</span>
        </div>
        <div className="rounded-md bg-[color:var(--color-bg)] p-2 font-mono text-xs">
          {props.trackingNumber}
        </div>
        {props.shippedAt && (
          <div className="text-[color:var(--color-muted)]">
            Gönderim: {new Date(props.shippedAt).toLocaleDateString("tr-TR")}
          </div>
        )}
        {props.deliveredAt && (
          <div className="text-[color:var(--color-muted)]">
            Teslim: {new Date(props.deliveredAt).toLocaleDateString("tr-TR")}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs hover:bg-[color:var(--color-fg)]/[0.04]"
          >
            Kargo takip <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {!isDelivered && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={markDelivered}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            Teslim edildi olarak işaretle
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
