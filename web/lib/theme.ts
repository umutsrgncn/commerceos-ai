import { cookies } from "next/headers";

export type Theme = "light" | "dark";
export const THEME_COOKIE = "commerceos-theme";

export async function readTheme(): Promise<Theme | null> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return value === "dark" || value === "light" ? value : null;
}
