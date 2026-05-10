/**
 * Birleşik test fixture.
 *
 *   import { test, expect } from "../../fixtures";
 *
 * Kapsam:
 *   - autopilot guard (her test başı/sonu OFF)
 *   - AI mock (default ON, E2E_REAL_AI=1 ile kapatılır)
 *   - authedPage (programmatic login + AI mock'lar yüklenmiş)
 *
 * Auth UI test ediliyorsa fixtures'tan değil vanilla `@playwright/test`'i
 * kullan.
 */

import { mergeTests } from "@playwright/test";
import { test as autopilotGuard } from "./autopilot-guard";
import { test as authed } from "./authed";

export const test = mergeTests(autopilotGuard, authed);
export { expect } from "@playwright/test";
