import Link from "next/link";
import { AuroraBackground } from "@/components/magic/aurora-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground showRadialGradient className="grid min-h-screen place-items-center p-6">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
              ⌘
            </span>
            CommerceOS
          </Link>
        </div>
        {children}
      </div>
    </AuroraBackground>
  );
}
