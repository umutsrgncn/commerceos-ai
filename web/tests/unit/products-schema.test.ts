import { describe, expect, it } from "vitest";
import {
  productCreateSchema,
  formatMinorUnits,
  slugify,
} from "@/lib/schemas/products";

describe("slugify", () => {
  it("strips Turkish diacritics", () => {
    expect(slugify("Çelik Bardak Şişesi")).toBe("celik-bardak-sisesi");
  });

  it("collapses runs of separators", () => {
    expect(slugify("  Hello,,  World!! ")).toBe("hello-world");
  });

  it("clamps to 160 chars", () => {
    const long = "a".repeat(300);
    expect(slugify(long).length).toBeLessThanOrEqual(160);
  });
});

describe("productCreateSchema", () => {
  const base = {
    name: "Test",
    slug: "test",
    sku: "ABC-1",
    price: "12.34",
    currency: "TRY" as const,
    status: "DRAFT" as const,
  };

  it("converts decimal price string to integer minor units", () => {
    const parsed = productCreateSchema.parse(base);
    expect(parsed.price).toBe(1234);
  });

  it("accepts comma-decimal locale input", () => {
    const parsed = productCreateSchema.parse({ ...base, price: "12,5" });
    expect(parsed.price).toBe(1250);
  });

  it("rejects negative price", () => {
    const result = productCreateSchema.safeParse({ ...base, price: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed slug", () => {
    const result = productCreateSchema.safeParse({ ...base, slug: "Invalid Slug" });
    expect(result.success).toBe(false);
  });

  it("rejects lowercase SKU", () => {
    const result = productCreateSchema.safeParse({ ...base, sku: "abc-1" });
    expect(result.success).toBe(false);
  });
});

describe("formatMinorUnits", () => {
  it("round-trips price for edit forms", () => {
    expect(formatMinorUnits(1234)).toBe("12.34");
    expect(formatMinorUnits(0)).toBe("0.00");
    expect(formatMinorUnits(99)).toBe("0.99");
  });
});
