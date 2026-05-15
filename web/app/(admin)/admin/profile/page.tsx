import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/queries/profile";
import { formatDate } from "@/lib/format";
import { ProfileForm } from "./components/profile-form";
import { PasswordForm } from "./components/password-form";

export const metadata = { title: "Profil — CommerceOS" };

const ROLE_VARIANT = {
  ADMIN: "success",
  MANAGER: "info",
  VIEWER: "neutral",
} as const;

const ROLE_LABEL = {
  ADMIN: "Yönetici",
  MANAGER: "Müdür",
  VIEWER: "Gözlemci",
} as const;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Kendi hesabını yönet. Mağaza ayarları için Ayarlar sayfasına git.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl font-semibold text-white">
            {initials}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{user.name ?? "İsim yok"}</span>
              <Badge variant={ROLE_VARIANT[user.role]}>
                {ROLE_LABEL[user.role]}
              </Badge>
            </div>
            <div className="text-sm text-[color:var(--color-muted)]">
              {user.email}
            </div>
            <div className="text-xs text-[color:var(--color-muted)]">
              Hesap oluşturuldu: {formatDate(user.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kişisel bilgiler</CardTitle>
            <CardDescription>İsim ve e-posta</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initial={{
                name: user.name ?? "",
                email: user.email,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Şifre
            </CardTitle>
            <CardDescription>
              {user.hasPassword
                ? "Mevcut şifreyle doğrulayıp yenile"
                : "OAuth ile giriş yaptığın için şifre yok"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.hasPassword ? (
              <PasswordForm />
            ) : (
              <p className="text-sm text-[color:var(--color-muted)]">
                Bu hesap Google OAuth üzerinden açılmış. Şifre değiştirmek için
                Google hesabının ayarlarına git.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
