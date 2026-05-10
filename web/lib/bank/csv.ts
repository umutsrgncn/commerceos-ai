/**
 * Generic CSV parser for bank statements.
 *
 * Banka extreleri farklı kolon adları kullanır (Tarih/Date, Tutar/Amount,
 * Açıklama/Description). Burada CSV'yi text olarak parse eder, kullanıcının
 * UI'da seçtiği kolon mapping ile BankTransaction'a yazarız.
 *
 * Kasıtlı olarak hafif: external CSV lib kullanmıyoruz. Quoting + escape
 * destekli mini parser.
 */

export type CsvCell = string;
export type CsvRow = CsvCell[];

export type ParsedCsv = {
  headers: CsvRow;
  rows: CsvRow[];
  delimiter: string;
};

/** RFC 4180-ish split. Quote + escaped quote ("") + LF/CRLF destekli. */
function splitLine(line: string, delimiter: string): CsvRow {
  const out: CsvRow = [];
  let cur = "";
  let inQuote = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuote = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuote = true;
        i++;
        continue;
      }
      if (ch === delimiter) {
        out.push(cur.trim());
        cur = "";
        i++;
        continue;
      }
      cur += ch;
      i++;
    }
  }
  out.push(cur.trim());
  return out;
}

function detectDelimiter(sample: string): string {
  // İlk 5 satıra bak, hangisi en stabil sayım veriyor?
  const lines = sample.split(/\r?\n/).slice(0, 5).filter(Boolean);
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestScore = -1;
  for (const d of candidates) {
    const counts = lines.map((l) => splitLine(l, d).length);
    if (counts.length === 0) continue;
    const max = Math.max(...counts);
    if (max < 2) continue;
    // Stable: tüm satırlarda aynı sayı + en çok kolon
    const stable = counts.every((c) => c === max);
    const score = max + (stable ? 100 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export function parseCsv(text: string): ParsedCsv {
  const trimmed = text.replace(/^﻿/, ""); // BOM strip
  const delimiter = detectDelimiter(trimmed);
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter };
  }
  const headers = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map((l) => splitLine(l, delimiter));
  return { headers, rows, delimiter };
}

/** Türkçe veya İngilizce ondalıklı tutar string'ini kuruşa çevir.
 *  "1.234,56" → 123456 / "1,234.56" → 123456 / "-50.00" → -5000 */
export function parseAmountToMinor(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return null;
  // Negatif işaretler: '-' veya '(...)'
  const negative = s.startsWith("-") || (s.startsWith("(") && s.endsWith(")"));
  let num = s.replace(/^[-+()]+/, "").replace(/\)$/, "");
  // Türkçe formatı: '.' binlik, ',' ondalık → standartlaştır
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(num)) {
    num = num.replace(/\./g, "").replace(",", ".");
  } else if (/,/.test(num) && !/\./.test(num)) {
    num = num.replace(",", ".");
  } else {
    num = num.replace(/,/g, "");
  }
  const f = Number(num);
  if (!Number.isFinite(f)) return null;
  const minor = Math.round(f * 100);
  return negative ? -minor : minor;
}

/** Çeşitli tarih formatlarını Date'e çevir.
 *  Destek: "2026-05-09", "09/05/2026", "09.05.2026", "2026-05-09T10:30",
 *  ISO datetime. Belirsizlik durumunda null. */
export function parseDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  // ISO/yyyy-mm-dd
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;
  let m = iso.exec(s);
  if (m) {
    const [, y, mo, d, hh = "0", mm = "0", ss = "0"] = m;
    const dt = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss),
    );
    return Number.isFinite(dt.getTime()) ? dt : null;
  }
  // dd/mm/yyyy or dd.mm.yyyy or dd-mm-yyyy
  const dmy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[T ](\d{2}):(\d{2}))?/;
  m = dmy.exec(s);
  if (m) {
    const [, d, mo, y, hh = "0", mm = "0"] = m;
    const dt = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(hh),
      Number(mm),
    );
    return Number.isFinite(dt.getTime()) ? dt : null;
  }
  const fallback = new Date(s);
  return Number.isFinite(fallback.getTime()) ? fallback : null;
}

export type ColumnMapping = {
  date: number;
  amount: number;
  description: number;
  reference?: number;
};

export type ParsedTransaction = {
  transactionDate: Date;
  amountMinor: number;
  description: string;
  reference: string | null;
  rawRow: Record<string, string>;
};

/** Detect column indices from headers using common Turkish/English aliases. */
export function suggestMapping(headers: CsvRow): Partial<ColumnMapping> {
  const norm = headers.map((h) =>
    h
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u"),
  );
  const findIdx = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const idx = norm.findIndex((h) => h.includes(k));
      if (idx >= 0) return idx;
    }
    return undefined;
  };
  return {
    date: findIdx("tarih", "date", "islem tarihi"),
    amount: findIdx("tutar", "amount", "miktar"),
    description: findIdx("aciklama", "description", "detay", "memo"),
    reference: findIdx("referans", "reference", "ref no", "fis"),
  };
}

export type RowParseError = {
  rowIndex: number;
  reason: string;
};

export function applyMapping(
  parsed: ParsedCsv,
  mapping: ColumnMapping,
): { ok: ParsedTransaction[]; errors: RowParseError[] } {
  const ok: ParsedTransaction[] = [];
  const errors: RowParseError[] = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    const dateRaw = row[mapping.date] ?? "";
    const amountRaw = row[mapping.amount] ?? "";
    const descRaw = row[mapping.description] ?? "";
    const refRaw = mapping.reference != null ? row[mapping.reference] ?? "" : "";

    const date = parseDate(dateRaw);
    const amount = parseAmountToMinor(amountRaw);

    if (!date) {
      errors.push({ rowIndex: i, reason: `Tarih parse edilemedi: ${dateRaw}` });
      continue;
    }
    if (amount === null || amount === 0) {
      errors.push({
        rowIndex: i,
        reason: `Tutar parse edilemedi veya sıfır: ${amountRaw}`,
      });
      continue;
    }

    const rawRow: Record<string, string> = {};
    parsed.headers.forEach((h, idx) => {
      rawRow[h] = row[idx] ?? "";
    });

    ok.push({
      transactionDate: date,
      amountMinor: amount,
      description: descRaw || "(boş açıklama)",
      reference: refRaw || null,
      rawRow,
    });
  }

  return { ok, errors };
}
