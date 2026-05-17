"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportProductsToCsv } from "@/lib/actions/products";
import type { ProductStatusValue } from "@/lib/schemas/products";

type CsvDownloadButtonProps = {
  q?: string;
  status?: ProductStatusValue;
};

export function CsvDownloadButton({ q, status }: CsvDownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const csv = await exportProductsToCsv({ q, status });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `urunler-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("CSV indirme hatası:", error);
      alert("CSV indirilirken bir hata oluştu.");
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload}>
      <Download className="h-4 w-4" />
      CSV İndir
    </Button>
  );
}
