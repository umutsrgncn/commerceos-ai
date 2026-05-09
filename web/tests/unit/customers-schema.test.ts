import { describe, expect, it } from "vitest";
import { customerCreateSchema } from "@/lib/schemas/customers";

describe("customerCreateSchema", () => {
  it("requires name + email", () => {
    expect(
      customerCreateSchema.safeParse({ name: "", email: "" }).success
    ).toBe(false);
  });

  it("accepts a minimal payload", () => {
    const parsed = customerCreateSchema.parse({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(parsed.name).toBe("Ada Lovelace");
  });

  it("normalizes empty phone string to null", () => {
    const parsed = customerCreateSchema.parse({
      name: "Ada",
      email: "ada@example.com",
      phone: "",
    });
    expect(parsed.phone).toBeNull();
  });

  it("rejects non-email strings", () => {
    const r = customerCreateSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
    });
    expect(r.success).toBe(false);
  });

  it("rejects gibberish phone formats", () => {
    const r = customerCreateSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      phone: "abc",
    });
    expect(r.success).toBe(false);
  });
});
