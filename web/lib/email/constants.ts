/** Email kampanya segment sabitleri — server action'larından ayrılmış. */

export const SEGMENTS = ["sadık", "VIP", "yeni", "risky", "all"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const SEGMENT_LABELS: Record<Segment, string> = {
  "sadık": "Sadık müşteriler",
  VIP: "VIP",
  yeni: "Yeni müşteriler",
  risky: "Geri kazanım hedefi",
  all: "Tüm müşteriler",
};
