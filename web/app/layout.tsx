import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommerceOS — Admin",
  description: "AI-powered commerce admin console.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
