import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format";

describe("formatMoney", () => {
  it("renders TRY minor units with the lira symbol", () => {
    expect(formatMoney(123456, "TRY")).toMatch(/123\.456,00/);
    expect(formatMoney(123456, "TRY")).toContain("₺");
  });

  it("treats 0 as zero, not '—'", () => {
    expect(formatMoney(0, "TRY")).toMatch(/0,00/);
  });

  it("formats USD differently from TRY", () => {
    expect(formatMoney(99900, "USD")).toContain("$");
  });
});
