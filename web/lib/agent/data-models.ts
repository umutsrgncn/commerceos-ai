import { readFileSync } from "node:fs";
import path from "node:path";

const SCHEMA_PATH =
  process.env.AGENT_SCHEMA_PATH ??
  path.join(process.env.AGENT_REPO_ROOT ?? "/opt/commerceos", "web/prisma/schema.prisma");

/**
 * Prisma schema.prisma'yı parse edip planner'a vereceğimiz özet metni üretir.
 * Manuel yazılmış model listesi hata kaynağıydı — dinamik çıkarımla gerçek schema'ya bağlı kalıyoruz.
 *
 * Format:
 *   ModelName (field1: Type, field2: Type, ...)
 */
function parseSchema(): string {
  let txt: string;
  try {
    txt = readFileSync(SCHEMA_PATH, "utf8");
  } catch {
    return "(prisma/schema.prisma okunamadı — agent grep ile aramak zorunda)";
  }

  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  const enumRe = /^enum\s+(\w+)\s*\{([\s\S]*?)^\}/gm;

  const models: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = modelRe.exec(txt))) {
    const name = m[1];
    const body = m[2];
    const fields: string[] = [];
    for (const line of body.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("//") || t.startsWith("@@")) continue;
      // "fieldName Type [@modifiers]"
      const fm = t.match(/^(\w+)\s+(\w+\??(?:\[\])?)/);
      if (!fm) continue;
      const fieldName = fm[1];
      const fieldType = fm[2];
      // İlişki/Json gibi karmaşık alanları atla — kullanılabilir alanlar lazım
      if (fieldName === fieldName.charAt(0).toLowerCase() + fieldName.slice(1) === false) continue;
      fields.push(`${fieldName}: ${fieldType}`);
    }
    // Prisma generated client adı = camelCase model adı
    const clientName = name.charAt(0).toLowerCase() + name.slice(1);
    models.push(`- db.${clientName}  →  ${name} (${fields.slice(0, 10).join(", ")}${fields.length > 10 ? ", …" : ""})`);
  }

  const enums: string[] = [];
  while ((m = enumRe.exec(txt))) {
    const name = m[1];
    const body = m[2];
    const values = body
      .split("\n")
      .map((l) => l.trim().split(/[\s/]/)[0])
      .filter(Boolean)
      .filter((v) => /^[A-Z_]+$/.test(v));
    enums.push(`- ${name}: ${values.join(" | ")}`);
  }

  return `Modeller (gerçek prisma/schema.prisma'dan çıkarılmıştır — bu LİSTE OTORİTEDİR):

${models.join("\n")}

Enum'lar:
${enums.join("\n")}

KRİTİK NOTLAR:
1. Yeni model, yeni alan, yeni migration EKLEME — yukarıdaki alanlar yeterli olduğu sürece görev YAPILABİLİR.
2. Prisma client adları YUKARIDA aynen yazıldığı gibidir — uydurmaca yok.
3. KVKK işlemleri için DataDeletionRequest modeli kullanılır (mail göndermek YOK, kayıt oluştur).
4. ActivityLog ile audit trail bırakmak iyidir ama zorunlu değil.
5. Müşteri kaydını DOĞRUDAN silmeme — DataDeletionRequest oluşturup admin'in onayına bırak.
`;
}

export const DATA_MODELS_SUMMARY = parseSchema();
