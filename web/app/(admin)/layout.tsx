import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AutoPilotPilot } from "@/components/layout/autopilot-pilot";
import { OnboardingWizard } from "@/components/layout/onboarding-wizard";
import { readTheme } from "@/lib/theme";
import { getSettings } from "@/lib/queries/settings";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [theme, settings] = await Promise.all([
    readTheme(),
    getSettings(),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={(session.user as { role?: string }).role} />
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <Topbar
          user={{
            ...session.user,
            role: (session.user as { role?: string }).role,
          }}
          theme={theme ?? "light"}
        />
        <main className="flex-1 p-3 sm:p-4 md:p-6 min-w-0 themed-scroll overflow-x-auto">
          {children}
        </main>
      </div>
      {/* Floating canlı Otopilot indicator (otopilot AÇIK iken sağ alt) */}
      <AutoPilotPilot initialEnabled={settings.autoPilotEnabled} />
      {/* İlk girişte onboarding turu — completed sonrası bir daha açılmaz */}
      {!settings.onboardingCompletedAt && <OnboardingWizard />}
    </div>
  );
}
