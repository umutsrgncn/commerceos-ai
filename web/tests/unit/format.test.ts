import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("renders TRY minor units with the lira symbol", () => {
    // 123456 kuruş = 1234,56 ₺ (formatMoney /100 ile lira'ya çevirir)
    expect(formatMoney(123456, "TRY")).toMatch(/1\.234,56/);
    expect(formatMoney(123456, "TRY")).toContain("₺");
  });

  it("treats 0 as zero, not '—'", () => {
    expect(formatMoney(0, "TRY")).toMatch(/0,00/);
  });

  it("formats USD differently from TRY", () => {
    expect(formatMoney(99900, "USD")).toContain("$");
  });
});
