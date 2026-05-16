/**
 * Agent tool I/O için metin yardımcıları.
 *
 * - Read çıktısına satır numarası ekle (model indentation'ı görsün)
 * - Edit girdisinde olası satır numarası prefix'lerini sıyır (model yanlışlıkla koyduysa)
 * - Curly quote → straight quote normalize (tokenizer farklılığı için)
 * - Trailing whitespace tolerance
 */

const LEFT_SINGLE_CURLY = "‘";
const RIGHT_SINGLE_CURLY = "’";
const LEFT_DOUBLE_CURLY = "“";
const RIGHT_DOUBLE_CURLY = "”";
const ARROW = "→"; // →

/** `cat -n` benzeri çıktı — modele indentation'ı görselleştirir. */
export function addLineNumbers(content: string, startLine = 1): string {
  if (!content) return "";
  const lines = content.split(/\r?\n/);
  return lines
    .map((line, i) => {
      const num = String(i + startLine).padStart(6, " ");
      return `${num}${ARROW}${line}`;
    })
    .join("\n");
}

/**
 * Modelin verdiği old_string'de satır numarası prefix'i olabilir (örn. "   12→content").
 * Defansif: prefix'leri tek tek sıyır.
 */
export function stripLineNumbers(input: string): string {
  return input
    .split("\n")
    .map((ln) => {
      // "   42→actual_content" → "actual_content"
      // "42\tactual_content"     → "actual_content"
      const m = ln.match(/^\s*\d+[→\t](.*)$/);
      return m ? m[1] : ln;
    })
    .join("\n");
}

/** Curly quote'ları straight quote'a normalize et. */
export function normalizeQuotes(s: string): string {
  return s
    .split(LEFT_SINGLE_CURLY).join("'")
    .split(RIGHT_SINGLE_CURLY).join("'")
    .split(LEFT_DOUBLE_CURLY).join('"')
    .split(RIGHT_DOUBLE_CURLY).join('"');
}

/** Her satırın sonundaki whitespace'i sil — fuzzy match için. */
export function stripTrailingWs(s: string): string {
  return s
    .split(/(\r\n|\n|\r)/)
    .map((part, i) => (i % 2 === 0 ? part.replace(/[ \t]+$/, "") : part))
    .join("");
}

/**
 * Dosya içeriğinde search string'i bul.
 * Sıralı toleranslar:
 *   1) exact match
 *   2) line-number prefix'leri sıyır
 *   3) curly → straight quote normalize
 *   4) trailing whitespace strip
 *
 * Dönüş: dosyadaki ORİJİNAL substring (yazılırken format korunsun).
 */
export function findFuzzyMatch(
  fileContent: string,
  search: string,
): { actual: string; method: "exact" | "stripped" | "quotes" | "ws" | "indent" } | null {
  // 1) Exact
  if (fileContent.includes(search)) {
    return { actual: search, method: "exact" };
  }

  // 2) Strip line number prefix'i (model yanlışlıkla koyduysa)
  const stripped = stripLineNumbers(search);
  if (stripped !== search && fileContent.includes(stripped)) {
    return { actual: stripped, method: "stripped" };
  }

  // 3) Quote normalize
  const normSearch = normalizeQuotes(stripped);
  const normFile = normalizeQuotes(fileContent);
  let idx = normFile.indexOf(normSearch);
  if (idx !== -1) {
    return {
      actual: fileContent.substring(idx, idx + normSearch.length),
      method: "quotes",
    };
  }

  // 4) Trailing whitespace toleransı
  const wsSearch = stripTrailingWs(normSearch);
  const wsFile = stripTrailingWs(normFile);
  idx = wsFile.indexOf(wsSearch);
  if (idx !== -1) {
    return { actual: wsSearch, method: "ws" };
  }

  // 5) Indent-tolerant: agent indent farkıyla kopyalamış olabilir. Her satırın
  // başındaki whitespace'i strip et, dosyada da strip et, eşleştirmeyi dene.
  // Eğer bulunursa orijinal dosyadaki indentasyon korunarak döndür.
  const indentNormalized = indentNormalize(wsSearch);
  if (indentNormalized && indentNormalized !== wsSearch) {
    const fileIndentNorm = indentNormalize(wsFile);
    const indentIdx = fileIndentNorm.indexOf(indentNormalized);
    if (indentIdx !== -1) {
      // Orijinal dosyada bu pasajı bulmak için: indent-normalized içerikten
      // önceki ile aynı sayıda satıra dosya içinde geri sayıp orijinali çıkar
      const searchLineCount = indentNormalized.split("\n").length;
      const fileLines = wsFile.split("\n");
      const fileNormLines = fileIndentNorm.split("\n");
      for (let i = 0; i <= fileNormLines.length - searchLineCount; i++) {
        const slice = fileNormLines.slice(i, i + searchLineCount).join("\n");
        if (slice === indentNormalized) {
          const original = fileLines.slice(i, i + searchLineCount).join("\n");
          return { actual: original, method: "indent" };
        }
      }
    }
  }

  return null;
}

/** Her satırın baş whitespace'ini sıyır — indent farkı toleransı için. */
function indentNormalize(s: string): string {
  return s
    .split("\n")
    .map((ln) => ln.replace(/^[ \t]+/, ""))
    .join("\n");
}

/**
 * Agent'a (model'e) yönelik "edit kurallı" hatırlatma metni.
 * read_file ve edit_file tool description'larında kullanılır.
 */
export const LINE_NUMBER_HINT = `Dosya içerikleri \`     N${ARROW}content\` formatında satır numarası prefix'i ile sunulur. Edit yaparken old_string'i KOPYALARKEN bu prefix'i (sayı + ${ARROW}) DAHIL ETME — sadece içerik kısmını al. Indentation (boşluk/tab) sayısı eski hale aynen kalmalı.`;

/**
 * Dosyada edit uygula — replace() iki kritik buga karşı güvenli:
 *
 *  1) $-interpolation bug: replace(s, v) v içinde $1/$&/$\` varsa string substitution
 *     pattern'i olarak yorumlanır. Callback () => v kullanarak literal yazar.
 *
 *  2) Trailing newline cleanup: Agent bir satırı SİLMEK için
 *     old_string='code line' + new_string='' verirse, dosyada
 *     'code line\n' varsa boş satır kalır. Buradan trailing \n'i de yut.
 */
export function applyEdit(
  content: string,
  oldStr: string,
  newStr: string,
  replaceAll: boolean,
): string {
  // Silme operasyonu — trailing newline da yutulsun
  if (newStr === "") {
    const includesWithNewline =
      !oldStr.endsWith("\n") && content.includes(oldStr + "\n");
    if (includesWithNewline) {
      const target = oldStr + "\n";
      return replaceAll
        ? content.split(target).join("")
        : content.replace(target, () => "");
    }
  }
  return replaceAll
    ? content.split(oldStr).join(newStr)
    : content.replace(oldStr, () => newStr);
}

/** Edit sonrası kaç satır eklendi/silindi/değişti — agent'a kısa özet için. */
export function diffSummary(
  before: string,
  after: string,
): { added: number; removed: number; changed: boolean } {
  if (before === after) return { added: 0, removed: 0, changed: false };
  const beforeLines = before.split("\n").length;
  const afterLines = after.split("\n").length;
  const delta = afterLines - beforeLines;
  if (delta > 0) return { added: delta, removed: 0, changed: true };
  if (delta < 0) return { added: 0, removed: -delta, changed: true };
  return { added: 0, removed: 0, changed: true }; // sadece satır içi değişiklik
}
