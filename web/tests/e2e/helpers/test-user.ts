/**
 * Test kullanıcısı sabitleri. Seed scripti `demo@commerceos.dev / demo1234`
 * ADMIN'i oluşturur — testler onu kullanır.
 *
 * Yeni test kullanıcısı isteniyorsa `seedTestUser()` ile oluşturulabilir
 * (db helper'a bak).
 */

export const TEST_ADMIN = {
  email: "demo@commerceos.dev",
  password: "demo1234",
  name: "Demo Admin",
  role: "ADMIN" as const,
};

/** Test verilerinin prefix'i. Cleanup `WHERE name LIKE 'E2E_%'` ile kolay. */
export const E2E_PREFIX = "E2E_";

/** Test entity adı oluşturucu. Aynı isim çakışmasını önlemek için timestamp. */
export function e2eName(label: string): string {
  return `${E2E_PREFIX}${label}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
