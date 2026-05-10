import "server-only";

/**
 * GİB e-fatura entegratör client'ı.
 *
 * - mode === "test": fatura asla dış servise gitmez. Local mock yanıt
 *   ('ACCEPTED') 600ms sonra döner — UI test edilebilir.
 * - mode === "production": SystemSettings'teki integratorUrl'ye SOAP/REST
 *   POST atılır. Entegratör spesifik (Foriba, Logo, BIM) — burada generic
 *   POST denemesi var; gerçek prod kullanımında bu fonksiyon kullanıcının
 *   entegratörünün API kontratına göre güncellenmeli.
 */

export type SendInvoiceResult =
  | {
      ok: true;
      acceptedAt: Date;
      mode: "test" | "production";
      remoteId?: string;
    }
  | { ok: false; error: string; mode: "test" | "production" };

export type GibCredentials = {
  mode: "test" | "production";
  integratorUrl?: string | null;
  username?: string | null;
  password?: string | null;
  senderAlias?: string | null;
};

export async function sendInvoiceToGib(
  ublXml: string,
  uuid: string,
  creds: GibCredentials
): Promise<SendInvoiceResult> {
  if (creds.mode === "test") {
    // Mock: gerçek bir HTTP yapmadan başarılı yanıt simülesi
    await new Promise((r) => setTimeout(r, 600));
    return {
      ok: true,
      mode: "test",
      acceptedAt: new Date(),
      remoteId: `TEST-${uuid.slice(0, 8)}`,
    };
  }

  if (!creds.integratorUrl) {
    return {
      ok: false,
      mode: "production",
      error: "Production modda integratorUrl gerekli (Ayarlar > GİB).",
    };
  }

  try {
    const auth =
      creds.username && creds.password
        ? "Basic " +
          Buffer.from(`${creds.username}:${creds.password}`).toString("base64")
        : undefined;

    const res = await fetch(creds.integratorUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        ...(auth ? { Authorization: auth } : {}),
        ...(creds.senderAlias ? { "X-Sender-Alias": creds.senderAlias } : {}),
      },
      body: ublXml,
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        mode: "production",
        error: `Entegratör ${res.status}: ${text.slice(0, 280)}`,
      };
    }

    const remoteId = res.headers.get("x-invoice-id") ?? undefined;
    return {
      ok: true,
      mode: "production",
      acceptedAt: new Date(),
      remoteId,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "production",
      error: err instanceof Error ? err.message : "Bilinmeyen entegratör hatası",
    };
  }
}
