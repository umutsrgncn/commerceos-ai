/** Kargo entegrasyonu için sabitler — server action'larından ayrılmış. */

export const CARRIERS = ["ARAS", "YURTICI", "MNG", "PTT", "OTHER"] as const;
export type Carrier = (typeof CARRIERS)[number];

export const CARRIER_LABELS: Record<Carrier, string> = {
  ARAS: "Aras Kargo",
  YURTICI: "Yurtiçi Kargo",
  MNG: "MNG Kargo",
  PTT: "PTT Kargo",
  OTHER: "Diğer",
};
