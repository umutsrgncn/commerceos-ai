/**
 * orderCreateSchema billing+shipping doğrulama testi.
 */

import { describe, expect, it } from "vitest";

import {
  billingAddressSchema,
  orderCreateSchema,
  shippingAddressSchema,
} from "../../lib/schemas/orders";

const ITEM = { productId: "ckc1234567890123456789012", quantity: 1 };
const CUSTOMER = "ckc1234567890123456789aaaa";

const VALID_SHIP = {
  fullName: "Ahmet Yılmaz",
  phone: "+90 555 000 00 00",
  line1: "Mahalle, sokak, no 12",
  line2: "Daire 3",
  city: "İstanbul",
  district: "Kadıköy",
  postalCode: "34710",
  country: "TR",
};

describe("shippingAddressSchema", () => {
  it("geçerli adresi kabul eder", () => {
    const r = shippingAddressSchema.safeParse(VALID_SHIP);
    expect(r.success).toBe(true);
  });

  it("kısa fullName reddedilir", () => {
    const r = shippingAddressSchema.safeParse({ ...VALID_SHIP, fullName: "A" });
    expect(r.success).toBe(false);
  });

  it("kısa line1 reddedilir", () => {
    const r = shippingAddressSchema.safeParse({ ...VALID_SHIP, line1: "ab" });
    expect(r.success).toBe(false);
  });

  it("country yoksa default 'TR'", () => {
    const r = shippingAddressSchema.safeParse({
      fullName: VALID_SHIP.fullName,
      line1: VALID_SHIP.line1,
      city: VALID_SHIP.city,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.country).toBe("TR");
  });
});

describe("billingAddressSchema", () => {
  it("kurumsal alanları (isCompany, taxId) kabul eder", () => {
    const r = billingAddressSchema.safeParse({
      ...VALID_SHIP,
      isCompany: true,
      taxId: "1234567890",
      taxOffice: "Kadıköy",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.isCompany).toBe(true);
  });

  it("isCompany boolean'a coerce edilir ('on' string)", () => {
    const r = billingAddressSchema.safeParse({
      ...VALID_SHIP,
      // FormData "on" string'i geliyor
      isCompany: "on" as unknown as boolean,
    });
    expect(r.success).toBe(true);
  });
});

describe("orderCreateSchema — billing/shipping entegrasyonu", () => {
  it("adres olmadan da geçer (eski sipariş davranışı)", () => {
    const r = orderCreateSchema.safeParse({
      customerId: CUSTOMER,
      items: [ITEM],
      taxRate: 0.2,
      shipping: 1500,
    });
    expect(r.success).toBe(true);
  });

  it("billingSameAsShipping default false", () => {
    const r = orderCreateSchema.safeParse({
      customerId: CUSTOMER,
      items: [ITEM],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.billingSameAsShipping).toBe(false);
  });

  it("shipping + billing birlikte parse olur", () => {
    const r = orderCreateSchema.safeParse({
      customerId: CUSTOMER,
      items: [ITEM],
      shippingAddress: VALID_SHIP,
      billingAddress: { ...VALID_SHIP, isCompany: true, taxId: "1111111111" },
      billingSameAsShipping: false,
    });
    expect(r.success).toBe(true);
  });

  it("geçersiz shippingAddress siparişi reddeder", () => {
    const r = orderCreateSchema.safeParse({
      customerId: CUSTOMER,
      items: [ITEM],
      shippingAddress: { fullName: "A", line1: "x", city: "İ" }, // kısa alanlar
    });
    expect(r.success).toBe(false);
  });
});
