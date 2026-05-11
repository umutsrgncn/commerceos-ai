import "server-only";

/**
 * iyzico client — Checkout Form initialize + retrieve.
 *
 * V1 IYZWS auth (sha1 + base64) sandbox'ta destekleniyor.
 * https://docs.iyzico.com/api/iyzipay-checkout-form
 */

import { createHash } from "node:crypto";
import {
  IYZICO_PRODUCTION,
  IYZICO_SANDBOX,
  SANDBOX_API_KEY,
  SANDBOX_SECRET_KEY,
} from "./constants";

export type IyzicoCredentials = {
  mode: "test" | "production";
  apiKey?: string | null;
  secretKey?: string | null;
};

function resolveCredentials(c: IyzicoCredentials): {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
} {
  if (c.mode === "test") {
    return {
      baseUrl: IYZICO_SANDBOX,
      apiKey: c.apiKey || SANDBOX_API_KEY,
      secretKey: c.secretKey || SANDBOX_SECRET_KEY,
    };
  }
  if (!c.apiKey || !c.secretKey) {
    throw new Error("Production mode için iyzico apiKey + secretKey gerekli.");
  }
  return {
    baseUrl: IYZICO_PRODUCTION,
    apiKey: c.apiKey,
    secretKey: c.secretKey,
  };
}

/** V1 IYZWS hash: sha1(apiKey + randomKey + secretKey + jsonBody) base64. */
function buildAuthHeader(
  apiKey: string,
  secretKey: string,
  randomKey: string,
  jsonBody: string,
): string {
  const hashStr = apiKey + randomKey + secretKey + jsonBody;
  const hash = createHash("sha1").update(hashStr).digest("base64");
  return `IYZWS ${apiKey}:${hash}`;
}

async function iyzicoFetch<T = unknown>(
  c: IyzicoCredentials,
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { baseUrl, apiKey, secretKey } = resolveCredentials(c);
  const randomKey = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
  const jsonBody = JSON.stringify(body);

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: buildAuthHeader(apiKey, secretKey, randomKey, jsonBody),
      "x-iyzi-rnd": randomKey,
    },
    body: jsonBody,
  });

  const text = await res.text();
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error(`iyzico HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return data;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type CheckoutInitInput = {
  conversationId: string;
  priceMinor: number; // total kuruş
  basketId: string; // sipariş id
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    identityNumber?: string; // TC, default mock
    registrationAddress: string;
    city: string;
    country: string;
    ip?: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    priceMinor: number;
    itemType?: "PHYSICAL" | "VIRTUAL";
  }>;
  shippingAddress?: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  billingAddress?: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
};

export type CheckoutInitResult = {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  token?: string;
  paymentPageUrl?: string;
  checkoutFormContent?: string; // HTML embedded form
  conversationId?: string;
  raw: Record<string, unknown>;
};

/** Kuruş → "X.XX" string (iyzico decimal istiyor). */
function minorToDecimal(minor: number): string {
  return (minor / 100).toFixed(2);
}

export async function initializeCheckout(
  c: IyzicoCredentials,
  input: CheckoutInitInput,
): Promise<CheckoutInitResult> {
  const price = minorToDecimal(input.priceMinor);

  const splitName = (full: string) => {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 1) return { name: parts[0], surname: "—" };
    return {
      name: parts.slice(0, -1).join(" "),
      surname: parts.at(-1) ?? "—",
    };
  };

  const body = {
    locale: "tr",
    conversationId: input.conversationId,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: input.basketId,
    paymentGroup: "PRODUCT",
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: input.buyer.id,
      name: input.buyer.name,
      surname: input.buyer.surname,
      gsmNumber: input.buyer.phone || "+905555555555",
      email: input.buyer.email,
      identityNumber: input.buyer.identityNumber || "11111111111",
      registrationAddress: input.buyer.registrationAddress,
      ip: input.buyer.ip || "85.34.78.112",
      city: input.buyer.city,
      country: input.buyer.country,
    },
    shippingAddress: input.shippingAddress
      ? {
          contactName: input.shippingAddress.contactName,
          city: input.shippingAddress.city,
          country: input.shippingAddress.country,
          address: input.shippingAddress.address,
          zipCode: input.shippingAddress.zipCode || "34000",
        }
      : {
          contactName: input.buyer.name + " " + input.buyer.surname,
          city: input.buyer.city,
          country: input.buyer.country,
          address: input.buyer.registrationAddress,
          zipCode: "34000",
        },
    billingAddress: input.billingAddress
      ? {
          contactName: input.billingAddress.contactName,
          city: input.billingAddress.city,
          country: input.billingAddress.country,
          address: input.billingAddress.address,
          zipCode: input.billingAddress.zipCode || "34000",
        }
      : {
          contactName: input.buyer.name + " " + input.buyer.surname,
          city: input.buyer.city,
          country: input.buyer.country,
          address: input.buyer.registrationAddress,
          zipCode: "34000",
        },
    basketItems: input.basketItems.map((it) => ({
      id: it.id,
      name: it.name,
      category1: it.category1,
      itemType: it.itemType || "PHYSICAL",
      price: minorToDecimal(it.priceMinor),
    })),
  };
  void splitName; // splitName helper export edebiliriz, şimdilik kullanılmıyor

  const data = await iyzicoFetch<{
    status: string;
    errorCode?: string;
    errorMessage?: string;
    errorGroup?: string;
    token?: string;
    paymentPageUrl?: string;
    checkoutFormContent?: string;
    conversationId?: string;
  }>(c, "/payment/iyzipos/checkoutform/initialize/auth/ecom", body);

  return {
    status: data.status === "success" ? "success" : "failure",
    errorCode: data.errorCode,
    errorMessage: data.errorMessage,
    errorGroup: data.errorGroup,
    token: data.token,
    paymentPageUrl: data.paymentPageUrl,
    checkoutFormContent: data.checkoutFormContent,
    conversationId: data.conversationId,
    raw: data as Record<string, unknown>,
  };
}

export type RetrieveResult = {
  status: "success" | "failure";
  paymentStatus?: string; // SUCCESS / FAILURE
  paymentId?: string;
  conversationId?: string;
  errorMessage?: string;
  errorCode?: string;
  fraudStatus?: number;
  paidPrice?: string;
  raw: Record<string, unknown>;
};

/** Callback'te token ile sonuç sorgu. */
export async function retrieveCheckout(
  c: IyzicoCredentials,
  token: string,
): Promise<RetrieveResult> {
  const data = await iyzicoFetch<{
    status: string;
    paymentStatus?: string;
    paymentId?: string;
    conversationId?: string;
    errorMessage?: string;
    errorCode?: string;
    fraudStatus?: number;
    paidPrice?: string;
  }>(c, "/payment/iyzipos/checkoutform/auth/ecom/detail", {
    locale: "tr",
    token,
  });

  return {
    status: data.status === "success" ? "success" : "failure",
    paymentStatus: data.paymentStatus,
    paymentId: data.paymentId,
    conversationId: data.conversationId,
    errorMessage: data.errorMessage,
    errorCode: data.errorCode,
    fraudStatus: data.fraudStatus,
    paidPrice: data.paidPrice,
    raw: data as Record<string, unknown>,
  };
}
