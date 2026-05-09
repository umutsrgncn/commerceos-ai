import { describe, expect, it } from "vitest";
import {
  canTransition,
  generateOrderNumber,
  getNextStatuses,
  statusLabel,
} from "@/lib/orders/workflow";

describe("getNextStatuses", () => {
  it("PENDING can be confirmed or cancelled", () => {
    expect(getNextStatuses("PENDING")).toEqual(["CONFIRMED", "CANCELLED"]);
  });

  it("DELIVERED can only be refunded after the fact", () => {
    expect(getNextStatuses("DELIVERED")).toEqual(["REFUNDED"]);
  });

  it("terminal states have no outgoing transitions", () => {
    expect(getNextStatuses("CANCELLED")).toEqual([]);
    expect(getNextStatuses("REFUNDED")).toEqual([]);
  });
});

describe("canTransition", () => {
  it("blocks reverse moves", () => {
    expect(canTransition("CONFIRMED", "PENDING")).toBe(false);
    expect(canTransition("DELIVERED", "SHIPPED")).toBe(false);
  });

  it("allows the canonical happy path", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("allows side branches (cancel from pending/confirmed, refund from shipped/delivered)", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("SHIPPED", "REFUNDED")).toBe(true);
    expect(canTransition("DELIVERED", "REFUNDED")).toBe(true);
  });

  it("denies transitioning out of CANCELLED", () => {
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("CANCELLED", "REFUNDED")).toBe(false);
  });
});

describe("statusLabel", () => {
  it("returns Turkish labels", () => {
    expect(statusLabel("PENDING")).toBe("Beklemede");
    expect(statusLabel("DELIVERED")).toBe("Teslim edildi");
  });
});

describe("generateOrderNumber", () => {
  it("matches the documented ORD-YYMMDDHH-XXXX shape", () => {
    const number = generateOrderNumber(new Date(2026, 4, 9, 14)); // 2026-05-09 14:00
    expect(number).toMatch(/^ORD-26050914-[0-9A-F]{4}$/);
  });

  it("varies the suffix across calls (collision-resistant)", () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    // Random 16-bit space; could theoretically collide but extremely rare.
    expect(a).not.toBe(b);
  });
});
