/**
 * Rol hiyerarşi unit testi.
 *
 * `requireRole` ve `getCurrentRole` Server-only (auth() bağımlı), bu testte
 * sadece saf fonksiyon olan `hasRole`'u test ediyoruz — UI ve action giriş
 * kontrolünün matematik temeli budur.
 */

import { describe, expect, it } from "vitest";

import { hasRole } from "../../lib/auth/role-utils";

describe("hasRole — rol hiyerarşi", () => {
  it("VIEWER en az VIEWER yapabilir", () => {
    expect(hasRole("VIEWER", "VIEWER")).toBe(true);
  });

  it("VIEWER MANAGER yapamaz", () => {
    expect(hasRole("VIEWER", "MANAGER")).toBe(false);
  });

  it("VIEWER ADMIN yapamaz", () => {
    expect(hasRole("VIEWER", "ADMIN")).toBe(false);
  });

  it("MANAGER en az VIEWER yapabilir", () => {
    expect(hasRole("MANAGER", "VIEWER")).toBe(true);
  });

  it("MANAGER en az MANAGER yapabilir", () => {
    expect(hasRole("MANAGER", "MANAGER")).toBe(true);
  });

  it("MANAGER ADMIN yapamaz", () => {
    expect(hasRole("MANAGER", "ADMIN")).toBe(false);
  });

  it("ADMIN her şeyi yapabilir", () => {
    expect(hasRole("ADMIN", "VIEWER")).toBe(true);
    expect(hasRole("ADMIN", "MANAGER")).toBe(true);
    expect(hasRole("ADMIN", "ADMIN")).toBe(true);
  });

  it("undefined / null / bilinmeyen rol false döner", () => {
    expect(hasRole(undefined, "VIEWER")).toBe(false);
    expect(hasRole(null, "VIEWER")).toBe(false);
    expect(hasRole("", "VIEWER")).toBe(false);
    expect(hasRole("SUPERUSER", "VIEWER")).toBe(false);
  });
});
