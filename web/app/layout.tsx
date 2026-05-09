import type { Metadata } from "next";
import "./globals.css";
import { readTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "CommerceOS — Admin",
  description: "AI-powered commerce admin console.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = await readTheme();
  return (
    <html lang="en" suppressHydrationWarning {...(theme && { "data-theme": theme })}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
