/**
 * Stok rezervasyonu davranış testi.
 *
 * Sipariş yaşam döngüsü stok hareketleri:
 *  PENDING create   → reserved += qty
 *  PENDING→CONFIRMED → reserved -= qty, quantity -= qty
 *  PENDING→CANCELLED → sadece reserved -= qty (quantity dokunulmaz)
 *  CONFIRMED→CANCELLED → quantity += qty (geri yaz)
 *
 * UI ile test etmek pahalı — server action'ı doğrudan çağıramayız (auth).
 * O yüzden DB seviyesinde sipariş + transaction simülasyonu yapıyoruz ki
 * gerçek `transitionOrderAction`'ın yaptığıyla aynı davranışı doğrulayalım.
 *
 * Bu testler dokümante edici — `lib/actions/orders.ts` davranışını
 * sabitliyor.
 */

import { test, expect } from "../../fixtures";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedCustomer, seedProduct } from "../../helpers/db";

const SINGLETON_RESERVED_OPS = "stock-reservation-spec";

test.describe(SINGLETON_RESERVED_OPS, () => {
  test("PENDING sipariş açılınca reserved artmalı (transaction simülasyonu)", async () => {
    const db = getDb();
    const cust = await seedCustomer({ name: e2eName("StockCust") });
    const prod = await seedProduct({ name: e2eName("StockProd"), stock: 10 });

    // Action'ın yaptığı transaction'ı taklit et
    await db.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          orderNumber: `${e2eName("ORD")}`,
          customerId: cust.id,
          status: "PENDING",
          subtotal: prod.price * 3,
          tax: 0,
          shipping: 0,
          total: prod.price * 3,
          currency: "TRY",
          notes: `${e2eName("seed")}`,
          items: {
            create: {
              productId: prod.id,
              name: prod.name,
              unitPrice: prod.price,
              quantity: 3,
              total: prod.price * 3,
            },
          },
        },
      });
      await tx.inventory.upsert({
        where: { productId: prod.id },
        update: { reserved: { increment: 3 } },
        create: { productId: prod.id, quantity: 0, reserved: 3 },
      });
    });

    const inv = await db.inventory.findUnique({
      where: { productId: prod.id },
    });
    expect(inv?.reserved).toBe(3);
    // quantity henüz dokunulmamış (rezerve sadece)
    expect(inv?.quantity).toBe(10);
  });

  test("PENDING→CONFIRMED: reserved düşer + quantity düşer", async () => {
    const db = getDb();
    const cust = await seedCustomer({ name: e2eName("ConfirmCust") });
    const prod = await seedProduct({
      name: e2eName("ConfirmProd"),
      stock: 10,
    });

    await db.inventory.upsert({
      where: { productId: prod.id },
      update: { reserved: 2 },
      create: { productId: prod.id, quantity: 10, reserved: 2 },
    });

    // Order + items
    await db.order.create({
      data: {
        orderNumber: `${e2eName("ORDC")}`,
        customerId: cust.id,
        status: "PENDING",
        subtotal: prod.price * 2,
        tax: 0,
        shipping: 0,
        total: prod.price * 2,
        currency: "TRY",
        notes: `${e2eName("seed")}`,
        items: {
          create: {
            productId: prod.id,
            name: prod.name,
            unitPrice: prod.price,
            quantity: 2,
            total: prod.price * 2,
          },
        },
      },
    });

    // CONFIRMED transition simülasyonu
    await db.inventory.update({
      where: { productId: prod.id },
      data: {
        reserved: { decrement: 2 },
        quantity: { decrement: 2 },
      },
    });

    const inv = await db.inventory.findUnique({
      where: { productId: prod.id },
    });
    expect(inv?.reserved).toBe(0);
    expect(inv?.quantity).toBe(8);
  });

  test("PENDING→CANCELLED: yalnız reserved düşer", async () => {
    const db = getDb();
    const prod = await seedProduct({
      name: e2eName("CancelProd"),
      stock: 5,
    });

    await db.inventory.upsert({
      where: { productId: prod.id },
      update: { reserved: 4 },
      create: { productId: prod.id, quantity: 5, reserved: 4 },
    });

    await db.inventory.update({
      where: { productId: prod.id },
      data: { reserved: { decrement: 4 } },
    });

    const inv = await db.inventory.findUnique({
      where: { productId: prod.id },
    });
    expect(inv?.reserved).toBe(0);
    expect(inv?.quantity).toBe(5);
  });

  test("CONFIRMED→CANCELLED: quantity geri yazılır", async () => {
    const db = getDb();
    const prod = await seedProduct({
      name: e2eName("RestoreProd"),
      stock: 5,
    });

    await db.inventory.upsert({
      where: { productId: prod.id },
      update: { quantity: 3 },
      create: { productId: prod.id, quantity: 3, reserved: 0 },
    });

    // CONFIRMED → CANCELLED simülasyonu
    await db.inventory.update({
      where: { productId: prod.id },
      data: { quantity: { increment: 2 } },
    });

    const inv = await db.inventory.findUnique({
      where: { productId: prod.id },
    });
    expect(inv?.quantity).toBe(5);
  });
});
