/**
 * iyzico V1 IYZWS auth hash birim testi.
 *
 * Determinist: aynı girdiler → aynı hash. Bu test imza algoritmasının
 * iyzico'nun beklediği formatla uyumlu kaldığını doğrular (sha1 + base64).
 */

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildAuthHeader } from "../../lib/iyzico/auth-hash";

describe("iyzico buildAuthHeader", () => {
  const apiKey = "sandbox-test-key";
  const secretKey = "sandbox-test-secret";
  const randomKey = "1234567890123456";
  const body = '{"locale":"tr","conversationId":"abc"}';

  it("IYZWS prefix + apiKey + base64 hash döner", () => {
    const auth = buildAuthHeader(apiKey, secretKey, randomKey, body);
    expect(auth).toMatch(/^IYZWS sandbox-test-key:[A-Za-z0-9+/=]+$/);
  });

  it("hash beklenen sha1+base64 değeriyle eşleşir", () => {
    const expected = createHash("sha1")
      .update(apiKey + randomKey + secretKey + body)
      .digest("base64");
    const auth = buildAuthHeader(apiKey, secretKey, randomKey, body);
    expect(auth).toBe(`IYZWS ${apiKey}:${expected}`);
  });

  it("girdi değişince hash değişir (collision check)", () => {
    const a = buildAuthHeader(apiKey, secretKey, randomKey, body);
    const b = buildAuthHeader(apiKey, secretKey, randomKey, body + " ");
    expect(a).not.toBe(b);
  });

  it("aynı girdilerle deterministik (idempotent)", () => {
    const a = buildAuthHeader(apiKey, secretKey, randomKey, body);
    const b = buildAuthHeader(apiKey, secretKey, randomKey, body);
    expect(a).toBe(b);
  });
});
