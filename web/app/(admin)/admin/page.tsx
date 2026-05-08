import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard — CommerceOS" };

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name?.split(" ")[0] ?? "yönetici";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hoş geldin, {name}.
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Bugünün özeti — sayılar son 24 saatlik dilimden.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam ciro" value="—" hint="Bugün" />
        <StatCard label="Sipariş" value="—" hint="Bugün" />
        <StatCard label="Yeni müşteri" value="—" hint="Bu hafta" />
        <StatCard label="Stok uyarısı" value="—" hint="Düşük envanter" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hızlı başlangıç</CardTitle>
          <CardDescription>
            İlk ürünü ekle, AI&apos;ya açıklama yazdır, ilk siparişi oluştur.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[color:var(--color-muted)]">
          (Sayaçlar Prisma sorgularıyla bağlanacak — `feat(dashboard)` commit&apos;inde.)
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wider">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-[color:var(--color-muted)]">
        {hint}
      </CardContent>
    </Card>
  );
}
