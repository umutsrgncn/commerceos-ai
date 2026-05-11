/**
 * iyzico V1 IYZWS authentication header builder.
 *
 * Server-only değil — birim test bu modülü import edebilir.
 * `client.ts` re-export ediyor.
 */

import { createHash } from "node:crypto";

/** sha1(apiKey + randomKey + secretKey + jsonBody) → base64 → "IYZWS apiKey:hash" */
export function buildAuthHeader(
  apiKey: string,
  secretKey: string,
  randomKey: string,
  jsonBody: string,
): string {
  const hashStr = apiKey + randomKey + secretKey + jsonBody;
  const hash = createHash("sha1").update(hashStr).digest("base64");
  return `IYZWS ${apiKey}:${hash}`;
}
