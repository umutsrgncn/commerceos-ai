import { Building2, MapPin, Receipt } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Address = {
  fullName?: string;
  phone?: string | null;
  line1?: string;
  line2?: string | null;
  city?: string;
  district?: string | null;
  postalCode?: string | null;
  country?: string;
  isCompany?: boolean;
  taxId?: string | null;
  taxOffice?: string | null;
};

export function AddressCard({
  shipping,
  billing,
  sameAsShipping,
}: {
  shipping: Address | null | undefined;
  billing: Address | null | undefined;
  sameAsShipping: boolean;
}) {
  if (!shipping && !billing) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adresler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {shipping && (
          <Block
            icon={<MapPin className="h-3.5 w-3.5 text-emerald-500" />}
            title="Teslimat"
            address={shipping}
          />
        )}
        {sameAsShipping ? (
          <p className="rounded-md border border-dashed border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)]">
            <Receipt className="inline h-3.5 w-3.5 mr-1 text-indigo-500" />
            Fatura adresi teslimat ile aynı
          </p>
        ) : (
          billing && (
            <Block
              icon={
                billing.isCompany ? (
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                ) : (
                  <Receipt className="h-3.5 w-3.5 text-indigo-500" />
                )
              }
              title={billing.isCompany ? "Fatura (kurumsal)" : "Fatura"}
              address={billing}
              showCompany
            />
          )
        )}
      </CardContent>
    </Card>
  );
}

function Block({
  icon,
  title,
  address,
  showCompany = false,
}: {
  icon: React.ReactNode;
  title: string;
  address: Address;
  showCompany?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
        {icon}
        {title}
      </div>
      <div className="text-sm leading-relaxed">
        {address.fullName && (
          <div className="font-medium">{address.fullName}</div>
        )}
        {address.line1 && <div>{address.line1}</div>}
        {address.line2 && <div>{address.line2}</div>}
        {(address.city || address.district || address.postalCode) && (
          <div className="text-[color:var(--color-muted)]">
            {[address.district, address.city, address.postalCode]
              .filter(Boolean)
              .join(" / ")}
          </div>
        )}
        {address.country && address.country !== "TR" && (
          <div className="text-[color:var(--color-muted)]">
            {address.country}
          </div>
        )}
        {address.phone && (
          <div className="font-mono text-xs text-[color:var(--color-muted)]">
            {address.phone}
          </div>
        )}
        {showCompany && address.isCompany && (
          <div className="mt-1 text-xs text-[color:var(--color-muted)]">
            {address.taxId && <span>VKN: {address.taxId}</span>}
            {address.taxOffice && <span> · {address.taxOffice} VD</span>}
          </div>
        )}
      </div>
    </div>
  );
}
