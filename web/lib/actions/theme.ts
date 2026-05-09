"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setThemeAction(theme: Theme) {
  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    maxAge: ONE_YEAR,
    sameSite: "lax",
    path: "/",
  });
}
