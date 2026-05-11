"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  applyMapping,
  parseCsv,
  suggestMapping,
  type ColumnMapping,
} from "@/lib/bank/csv";
import { importBankCsvAction } from "@/lib/actions/bank";

type Step = "upload" | "preview" | "done";

export function CsvImportClient({
  defaultBankName,
  defaultIban,
}: {
  defaultBankName: string;
  defaultIban: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [csvText, setCsvText] = useState("");
  const [bankName, setBankName] = useState(defaultBankName);
  const [iban, setIban] = useState(defaultIban);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    autoMatched: number;
    skipped: number;
  } | null>(null);

  const parsed = useMemo(() => {
    if (!csvText) return null;
    return parseCsv(csvText);
  }, [csvText]);

  const suggested = useMemo(() => {
    if (!parsed) return {};
    return suggestMapping(parsed.headers);
  }, [parsed]);

  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const effectiveMapping = { ...suggested, ...mapping };

  const previewResult = useMemo(() => {
    if (!parsed) return null;
    if (
      effectiveMapping.date == null ||
      effectiveMapping.amount == null ||
      effectiveMapping.description == null
    ) {
      return null;
    }
    return applyMapping(parsed, effectiveMapping as ColumnMapping);
  }, [parsed, effectiveMapping]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      setMapping({});
      setStep("preview");
      setError(null);
    };
    reader.readAsText(file);
  }

  function doImport() {
    if (
      !parsed ||
      effectiveMapping.date == null ||
      effectiveMapping.amount == null ||
      effectiveMapping.description == null
    ) {
      setError("Tarih, tutar ve açıklama kolonları gerekli.");
      return;
    }
    setError(null);
    start(async () => {
      const r = await importBankCsvAction({
        csvText,
        bankName: bankName.trim() || "Bilinmeyen Banka",
        accountIban: iban.trim() || undefined,
        mapping: effectiveMapping as ColumnMapping,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResult({
        imported: r.imported,
        autoMatched: r.autoMatched,
        skipped: r.skipped,
      });
      setStep("done");
    });
  }

  if (step === "done" && result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-semibold">İçe aktarma tamamlandı</h2>
          <div className="grid grid-cols-3 gap-6 pt-2 text-sm">
            <Stat label="İçe aktarılan" value={result.imported} tone="info" />
            <Stat
              label="AI eşleştirdi"
              value={result.autoMatched}
              tone="success"
            />
            <Stat label="Atlanan" value={result.skipped} tone="muted" />
          </div>
          <p className="max-w-sm text-xs text-[color:var(--color-muted)]">
            Eşleşmemiş olanlar listede beklemekte; AI önerisi varsa
            "Önerilen" rozetiyle gösterilir, manuel onay verebilirsin.
          </p>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => router.push("/admin/bank")}>
              Banka listesine dön
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep("upload");
                setCsvText("");
                setResult(null);
              }}
            >
              Bir extre daha yükle
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Banka bilgisi</CardTitle>
          <CardDescription>
            Aynı bankanın aynı referans no'lu satırı tekrar yüklenirse atlanır
            (idempotent).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Banka adı</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Garanti BBVA"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iban">IBAN (opsiyonel)</Label>
            <Input
              id="iban"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. CSV dosyası</CardTitle>
          <CardDescription>
            Generic format: tarih, açıklama, tutar (TR/EN ayraçlar otomatik
            tespit edilir; "1.234,56" ve "1,234.56" parse edilir).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-6 py-10 text-center transition hover:bg-[color:var(--color-fg)]/[0.04]">
            <Upload className="h-6 w-6 text-[color:var(--color-muted)]" />
            <div className="text-sm font-medium">
              {csvText ? "Başka dosya seç" : "CSV dosyası yükle"}
            </div>
            <div className="text-xs text-[color:var(--color-muted)]">
              .csv uzantılı, ilk satır başlık olmalı
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="hidden"
            />
          </label>
        </CardContent>
      </Card>

      {parsed && parsed.headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Kolon eşleştirme</CardTitle>
            <CardDescription>
              Algılanan ayraç:{" "}
              <code className="font-mono">
                {parsed.delimiter === "\t" ? "TAB" : parsed.delimiter}
              </code>{" "}
              · {parsed.rows.length} satır · {parsed.headers.length} kolon
              {Object.keys(suggested).length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                  <Sparkles className="h-3 w-3" />
                  Otomatik tahmin uygulandı
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ColumnSelect
              label="Tarih *"
              value={effectiveMapping.date}
              headers={parsed.headers}
              onChange={(v) => setMapping((m) => ({ ...m, date: v }))}
            />
            <ColumnSelect
              label="Tutar *"
              value={effectiveMapping.amount}
              headers={parsed.headers}
              onChange={(v) => setMapping((m) => ({ ...m, amount: v }))}
            />
            <ColumnSelect
              label="Açıklama *"
              value={effectiveMapping.description}
              headers={parsed.headers}
              onChange={(v) => setMapping((m) => ({ ...m, description: v }))}
            />
            <ColumnSelect
              label="Referans (ops.)"
              value={effectiveMapping.reference}
              headers={parsed.headers}
              onChange={(v) => setMapping((m) => ({ ...m, reference: v }))}
              optional
            />
          </CardContent>
        </Card>
      )}

      {previewResult && (
        <Card>
          <CardHeader>
            <CardTitle>4. Önizleme</CardTitle>
            <CardDescription>
              {previewResult.ok.length} geçerli ·{" "}
              {previewResult.errors.length > 0 ? (
                <span className="text-amber-600">
                  {previewResult.errors.length} hatalı (parse edilemeyen) satır
                </span>
              ) : (
                <span className="text-emerald-600">Hatasız</span>
              )}
              · ilk 5 satır gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="themed-scroll overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-4 py-2 text-left font-medium">Tarih</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Açıklama
                    </th>
                    <th className="px-4 py-2 text-right font-medium">Tutar</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Yön
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewResult.ok.slice(0, 5).map((tx, i) => (
                    <tr
                      key={i}
                      className="border-b border-[color:var(--color-border)] last:border-b-0"
                    >
                      <td className="px-4 py-2 tabular-nums">
                        {tx.transactionDate.toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-2 max-w-md truncate" title={tx.description}>
                        {tx.description}
                      </td>
                      <td
                        className={
                          "px-4 py-2 text-right tabular-nums font-medium " +
                          (tx.amountMinor > 0
                            ? "text-emerald-600"
                            : "text-red-500")
                        }
                      >
                        {(tx.amountMinor / 100).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        ₺
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wider " +
                            (tx.amountMinor > 0
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600")
                          }
                        >
                          {tx.amountMinor > 0 ? "Gelen" : "Giden"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewResult.errors.length > 0 && (
              <div className="border-t border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <div className="space-y-1">
                    <div className="font-medium text-amber-700 dark:text-amber-400">
                      Parse hataları (ilk 3)
                    </div>
                    {previewResult.errors.slice(0, 3).map((e) => (
                      <div
                        key={e.rowIndex}
                        className="text-[color:var(--color-muted)]"
                      >
                        Satır {e.rowIndex + 2}: {e.reason}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {previewResult && previewResult.ok.length > 0 && (
        <div className="sticky bottom-0 -mx-2 flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-bg)]/70">
          <p className="text-xs text-[color:var(--color-muted)]">
            {previewResult.ok.length} işlem içe aktarılacak. AI havale
            açıklamasından sipariş eşleştirmeyi deneyecek.
          </p>
          <Button onClick={doImport} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                İçe aktarılıyor...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                İçe aktar + AI eşleştir
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ColumnSelect({
  label,
  value,
  headers,
  onChange,
  optional,
}: {
  label: string;
  value: number | undefined;
  headers: string[];
  onChange: (v: number | undefined) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value == null ? "" : String(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      >
        <option value="">{optional ? "(yok)" : "Kolon seç…"}</option>
        {headers.map((h, i) => (
          <option key={i} value={i}>
            {h || `Kolon ${i + 1}`}
          </option>
        ))}
      </Select>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "info" | "success" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "info"
        ? "text-indigo-600"
        : "text-[color:var(--color-muted)]";
  return (
    <div className="text-center">
      <div className={"text-2xl font-semibold tabular-nums " + toneClass}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
    </div>
  );
}
