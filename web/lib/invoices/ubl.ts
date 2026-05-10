import "server-only";
import { randomBytes } from "node:crypto";

/**
 * UBL-TR 1.2 e-fatura XML üretici.
 *
 * Bu üretici, GİB'in resmi UBL-TR 1.2 XML şemasının yöneticinin demo
 * akışını gösterecek kadarını çıkartır:
 *
 *   - cbc:UBLVersionID, cbc:CustomizationID, cbc:ProfileID (TICARIFATURA)
 *   - cbc:ID (fatura no), cbc:UUID, cbc:IssueDate, cbc:InvoiceTypeCode
 *   - cac:AccountingSupplierParty (mağaza)
 *   - cac:AccountingCustomerParty (müşteri)
 *   - cac:InvoiceLine[] (her sipariş kalemi için)
 *   - cac:LegalMonetaryTotal
 *
 * Gerçek GİB submission için entegratör SOAP zarfı + e-imza şart;
 * bunlar kullanıcının kendi prod ortamında halledilir.
 */

export type InvoicePayload = {
  invoiceNumber: string;
  uuid: string;
  issueDate: Date;
  currency: string;
  mode: "test" | "production";
  supplier: {
    name: string;
    taxId: string;
    address: string;
    city: string;
    country: string;
  };
  customer: {
    name: string;
    email?: string;
    address?: string;
    city?: string;
    taxId?: string;
  };
  lines: Array<{
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number; // minor units
    total: number; // minor units
    taxRate: number; // 0..1
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
};

export function newInvoiceUuid(): string {
  // UUID v4 (RFC 4122) — GİB UUID alanı için yeterli format.
  const buf = randomBytes(16);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = buf.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export function nextInvoiceNumber(year: number, sequence: number): string {
  return `GIB-${year}${String(sequence).padStart(7, "0")}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtMoney(minor: number): string {
  return (minor / 100).toFixed(2);
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildUblTrXml(p: InvoicePayload): string {
  const lines = p.lines
    .map((line, i) => {
      const lineNet = line.total - Math.round(line.total * line.taxRate);
      const lineTax = line.total - lineNet;
      return `
    <cac:InvoiceLine>
      <cbc:ID>${i + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${p.currency}">${fmtMoney(lineNet)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${escapeXml(line.name)}</cbc:Name>
        ${line.sku ? `<cac:SellersItemIdentification><cbc:ID>${escapeXml(line.sku)}</cbc:ID></cac:SellersItemIdentification>` : ""}
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${p.currency}">${fmtMoney(line.unitPrice)}</cbc:PriceAmount>
      </cac:Price>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${p.currency}">${fmtMoney(lineTax)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${p.currency}">${fmtMoney(lineNet)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${p.currency}">${fmtMoney(lineTax)}</cbc:TaxAmount>
          <cbc:Percent>${(line.taxRate * 100).toFixed(0)}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>KDV</cbc:Name>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
    </cac:InvoiceLine>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
  <cbc:ID>${escapeXml(p.invoiceNumber)}</cbc:ID>
  <cbc:UUID>${p.uuid}</cbc:UUID>
  <cbc:IssueDate>${fmtDate(p.issueDate)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${p.currency}</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXml(p.supplier.name)}</cbc:Name></cac:PartyName>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${escapeXml(p.supplier.taxId)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(p.supplier.address)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(p.supplier.city)}</cbc:CityName>
        <cac:Country><cbc:Name>${escapeXml(p.supplier.country)}</cbc:Name></cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXml(p.customer.name)}</cbc:Name></cac:PartyName>
      ${
        p.customer.taxId
          ? `<cac:PartyIdentification><cbc:ID schemeID="TCKN">${escapeXml(p.customer.taxId)}</cbc:ID></cac:PartyIdentification>`
          : ""
      }
      ${
        p.customer.email
          ? `<cac:Contact><cbc:ElectronicMail>${escapeXml(p.customer.email)}</cbc:ElectronicMail></cac:Contact>`
          : ""
      }
      ${
        p.customer.address || p.customer.city
          ? `<cac:PostalAddress>
              ${p.customer.address ? `<cbc:StreetName>${escapeXml(p.customer.address)}</cbc:StreetName>` : ""}
              ${p.customer.city ? `<cbc:CityName>${escapeXml(p.customer.city)}</cbc:CityName>` : ""}
              <cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>
            </cac:PostalAddress>`
          : ""
      }
    </cac:Party>
  </cac:AccountingCustomerParty>
${lines}

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${p.currency}">${fmtMoney(p.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${p.currency}">${fmtMoney(p.subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${p.currency}">${fmtMoney(p.subtotal + p.tax)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${p.currency}">${fmtMoney(p.total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
}
