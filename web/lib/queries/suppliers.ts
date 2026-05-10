import "server-only";
import { db } from "@/lib/db";

export async function listSuppliers() {
  return db.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function getSupplierById(id: string) {
  return db.supplier.findUnique({ where: { id } });
}

/** Belirli bir SKU için aktif tedarikçi bul (productSkus listesinde varsa).
 *  Otopilot stok düşünce hangi tedarikçiye yazacağını bilsin. */
export async function findSupplierForSku(sku: string) {
  return db.supplier.findFirst({
    where: {
      isActive: true,
      productSkus: { has: sku },
    },
  });
}
