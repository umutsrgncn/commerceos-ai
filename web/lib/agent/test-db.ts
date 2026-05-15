import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db } from "@/lib/db";

const exec = promisify(execFile);

const TEST_SCHEMA = "commerceos_test";
const PROD_SCHEMA = "public";

/**
 * Worktree dev server için DATABASE_URL — schema=commerceos_test ile.
 * Main app her zaman public schema'da kalır.
 *
 * DEFANSIF: Dönen URL'de schema=commerceos_test olduğunu KESİN bir şekilde
 * doğrula — herhangi bir parse hatasında throw, asla sessizce public'e
 * düşmesin. Production veriyi yok etme riskini sıfırlamak için.
 */
export function getTestDatabaseUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL env yok");
  let result: string;
  if (base.includes(`schema=${PROD_SCHEMA}`)) {
    result = base.replace(`schema=${PROD_SCHEMA}`, `schema=${TEST_SCHEMA}`);
  } else if (base.includes(`schema=${TEST_SCHEMA}`)) {
    result = base;
  } else {
    const sep = base.includes("?") ? "&" : "?";
    result = `${base}${sep}schema=${TEST_SCHEMA}`;
  }
  // Son URL kontrolü — schema=commerceos_test geçmiyorsa BIRAK
  if (!result.includes(`schema=${TEST_SCHEMA}`)) {
    throw new Error(
      `getTestDatabaseUrl güvenlik kontrolü fail: schema=${TEST_SCHEMA} URL'de yok`,
    );
  }
  if (result.includes(`schema=${PROD_SCHEMA}`)) {
    throw new Error(
      `getTestDatabaseUrl güvenlik kontrolü fail: schema=${PROD_SCHEMA} kalıntısı var`,
    );
  }
  return result;
}

/**
 * commerceos_test schema'yı oluştur ve Prisma migrate ile şemayı senkronla.
 * Idempotent — schema varsa atla.
 */
export async function ensureTestSchema(): Promise<void> {
  const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = ${TEST_SCHEMA}
    ) AS exists
  `;
  if (rows[0]?.exists) {
    // Schema var, tablolar da var mı kısaca kontrol
    const tableCount = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = ${TEST_SCHEMA}
    `;
    if (Number(tableCount[0]?.count ?? 0) > 0) return;
  }

  // Schema yoksa veya boşsa, prisma migrate deploy ile kur.
  await db.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${TEST_SCHEMA}"`);
  await exec(
    "pnpm",
    ["prisma", "migrate", "deploy"],
    {
      cwd: process.cwd(), // web/
      env: { ...process.env, DATABASE_URL: getTestDatabaseUrl() },
      maxBuffer: 1024 * 1024 * 8,
      timeout: 120_000,
    },
  );
}

/**
 * Test schema'daki tüm tabloları sıfırla.
 * Foreign key'leri respect etmek için RESTART IDENTITY CASCADE kullan.
 */
export async function truncateTestSchema(): Promise<void> {
  const tables = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ${TEST_SCHEMA}
      AND tablename NOT LIKE '\\_prisma_%' ESCAPE '\\'
  `;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"${TEST_SCHEMA}"."${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

/**
 * Public'ten sınırlı veriyi commerceos_test'e kopyala.
 * FK dependency-aware sıra: parent → child.
 */
export async function seedTestSchema(): Promise<void> {
  // FK dependency order — Prisma schema'daki ilişkilere göre
  // Parent tablolar ilk + child tabloların fkFilter'ı parent'a referans verir
  // (limit'lerden kaynaklı FK violation'ı önler; sadece test schema'da parent'ı
  // olan child satırlar kopyalanır)
  type FK = { column: string; refTable: string; refColumn?: string };
  const copyTables: Array<{ name: string; limit?: number; fkFilters?: FK[] }> = [
    { name: "User", limit: 20 },
    { name: "Category" },
    { name: "Supplier" },
    { name: "Customer", limit: 30 },
    { name: "Address", limit: 50, fkFilters: [{ column: "customerId", refTable: "Customer" }] },
    { name: "Product", limit: 50 },
    { name: "ProductVariant", limit: 100, fkFilters: [{ column: "productId", refTable: "Product" }] },
    { name: "Inventory", limit: 100, fkFilters: [{ column: "productId", refTable: "Product" }] },
    { name: "Discount" },
    { name: "Order", limit: 30, fkFilters: [{ column: "customerId", refTable: "Customer" }] },
    { name: "OrderItem", limit: 100, fkFilters: [{ column: "orderId", refTable: "Order" }, { column: "productId", refTable: "Product" }] },
    { name: "Payment", limit: 30, fkFilters: [{ column: "orderId", refTable: "Order" }] },
    { name: "ProductReview", limit: 50, fkFilters: [{ column: "productId", refTable: "Product" }] },
    { name: "Wishlist", limit: 50, fkFilters: [{ column: "customerId", refTable: "Customer" }] },
    { name: "Cart", limit: 10, fkFilters: [{ column: "customerId", refTable: "Customer" }] },
    { name: "CartItem", limit: 30, fkFilters: [{ column: "cartId", refTable: "Cart" }, { column: "productId", refTable: "Product" }] },
    { name: "ActivityLog", limit: 100 },
    { name: "SalesGoal" },
    { name: "Expense", limit: 50 },
    { name: "ScheduledExpense", limit: 30 },
    { name: "BankAccount" },
    { name: "BankTransaction", limit: 50, fkFilters: [{ column: "bankAccountId", refTable: "BankAccount" }] },
    { name: "Invoice", limit: 30, fkFilters: [{ column: "orderId", refTable: "Order" }] },
    { name: "Anomaly", limit: 30 },
    { name: "Notification", limit: 30 },
    { name: "DataRequest", limit: 10, fkFilters: [{ column: "customerId", refTable: "Customer" }] },
    { name: "CookieConsent", limit: 30 },
    { name: "AutopilotEvent", limit: 50 },
  ];

  for (const { name, limit, fkFilters } of copyTables) {
    try {
      // Public ve test schema'da farklı enum tipleri olduğu için SELECT * çalışmaz
      // (PostgreSQL "type Role of public ≠ type Role of commerceos_test" der).
      // Kolon listesini al, enum kolonlarını text üzerinden cast et.
      const cols = await db.$queryRaw<
        Array<{ column_name: string; data_type: string; udt_name: string }>
      >`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = ${PROD_SCHEMA} AND table_name = ${name}
        ORDER BY ordinal_position
      `;
      if (cols.length === 0) {
        // Tablo public'te yok — sessizce atla
        continue;
      }
      // Test schema'da tablo var mı? (Prisma schema'da olmayan ama public'te
      // var olan tablolar için defansif — örn. manuel BankAccount)
      const testTbl = await db.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = ${TEST_SCHEMA} AND table_name = ${name}
        ) AS exists
      `;
      if (!testTbl[0]?.exists) {
        continue;
      }
      const selectExpr = cols
        .map((c) => {
          const q = `"${c.column_name}"`;
          // USER-DEFINED = enum / composite — text üzerinden test schema'nın tipine cast et
          if (c.data_type === "USER-DEFINED") {
            return `${q}::text::"${TEST_SCHEMA}"."${c.udt_name}"`;
          }
          return q;
        })
        .join(", ");
      const limitClause = limit ? ` LIMIT ${limit}` : "";
      // FK filter — child tabloların kopyalanan parent ID'leri olmayan
      // satırları atla (FK violation engellenir). FK ref tablosu test
      // schema'da yoksa o filter atlanır (veya tablo komple skip edilir).
      let fkWhere = "";
      if (fkFilters && fkFilters.length > 0) {
        const validFilters: typeof fkFilters = [];
        let allRefsExist = true;
        for (const f of fkFilters) {
          const ref = await db.$queryRaw<Array<{ exists: boolean }>>`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables
              WHERE table_schema = ${TEST_SCHEMA} AND table_name = ${f.refTable}
            ) AS exists
          `;
          if (ref[0]?.exists) {
            validFilters.push(f);
          } else {
            // Ref tablo test schema'da yok — tüm tabloyu atla (FK violation kesin)
            allRefsExist = false;
            break;
          }
        }
        if (!allRefsExist) continue;
        if (validFilters.length > 0) {
          fkWhere =
            " WHERE " +
            validFilters
              .map(
                (f) =>
                  `"${f.column}" IN (SELECT "${f.refColumn ?? "id"}" FROM "${TEST_SCHEMA}"."${f.refTable}")`,
              )
              .join(" AND ");
        }
      }
      await db.$executeRawUnsafe(
        `INSERT INTO "${TEST_SCHEMA}"."${name}" SELECT ${selectExpr} FROM "${PROD_SCHEMA}"."${name}"${fkWhere}${limitClause} ON CONFLICT DO NOTHING`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(`[test-db] seed ${name} atlandı: ${msg.slice(0, 200)}`);
    }
  }
}

/**
 * Tam reset — truncate + reseed. Worker task başlangıcında çağrılır.
 */
export async function resetTestData(): Promise<void> {
  await ensureTestSchema();
  await truncateTestSchema();
  await seedTestSchema();
}
