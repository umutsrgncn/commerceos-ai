import { redirect } from "next/navigation";
import { Users as UsersIcon } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasRole, ROLE_LABEL, ROLE_DESCRIPTION } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { InviteUserCard } from "./components/invite-user-card";
import { UserRoleControls } from "./components/user-role-controls";

export const metadata = { title: "Ekip — CommerceOS" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!hasRole(role, "ADMIN")) {
    redirect("/admin");
  }

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const meId = session!.user!.id;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-indigo-500/[0.06] via-fuchsia-500/[0.04] to-emerald-500/[0.04] px-4 py-4 sm:px-6 sm:py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
          <UsersIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Ekip ve Roller
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            Yeni kullanıcı davet et, rolleri yönet. Her rolün ne yapabileceği
            aşağıda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["ADMIN", "MANAGER", "VIEWER"] as const).map((r) => (
          <div
            key={r}
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3"
          >
            <div className="text-sm font-semibold">{ROLE_LABEL[r]}</div>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              {ROLE_DESCRIPTION[r]}
            </p>
          </div>
        ))}
      </div>

      <InviteUserCard />

      <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-fg)]/[0.03]">
            <tr className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
              <th className="px-4 py-2.5 text-left font-medium">Kullanıcı</th>
              <th className="px-4 py-2.5 text-left font-medium">E-posta</th>
              <th className="px-4 py-2.5 text-left font-medium">Rol</th>
              <th className="px-4 py-2.5 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-[color:var(--color-border)]"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name ?? "—"}</div>
                  <div className="text-[10px] text-[color:var(--color-muted)]">
                    {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                    {u.id === meId && (
                      <span className="ml-2 rounded-full bg-fuchsia-500/15 px-1.5 py-0.5 text-fuchsia-600 dark:text-fuchsia-400">
                        sen
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      u.role === "ADMIN"
                        ? "info"
                        : u.role === "MANAGER"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {ROLE_LABEL[u.role]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <UserRoleControls
                    userId={u.id}
                    currentRole={u.role}
                    isMe={u.id === meId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
