/**
 * Birleşik test fixture.
 *
 * Çoğu spec şunu kullanır:
 *   import { test, expect } from "../../fixtures";
 *
 * Bu, otopilot guard + AI mock + opsiyonel programmatic auth + DB helper'ı
 * tek import'tan getirir.
 *
 * Auth UI test ediliyorsa `auth.ts` import etme — `@playwright/test`'i
 * direkt kullan.
 */

import { mergeTests } from "@playwright/test";
import { test as autopilotGuard } from "./autopilot-guard";
import { test as aiMock } from "./ai-mock";
import { test as authed } from "./authed";

export const test = mergeTests(autopilotGuard, aiMock, authed);
export { expect } from "@playwright/test";
