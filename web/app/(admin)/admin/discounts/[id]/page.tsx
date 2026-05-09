import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDiscountById } from "@/lib/queries/discounts";
import { deleteDiscountAction } from "@/lib/actions/discounts";
import { DiscountForm } from "../components/discount-form";

export const metadata = { title: "İndirim — CommerceOS" };

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const discount = await getDiscountById(id);
  if (!discount) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/discounts"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> İndirimler
        </Link>

        <form action={deleteDiscountAction}>
          <input type="hidden" name="id" value={discount.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <div>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">
          {discount.code}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          {discount.redemptionCount} kullanıldı
          {discount.maxRedemptions ? ` / ${discount.maxRedemptions}` : ""}
        </p>
      </div>

      <DiscountForm
        mode="edit"
        initial={{
          id: discount.id,
          code: discount.code,
          description: discount.description,
          type: discount.type,
          value: discount.value,
          minSubtotal: discount.minSubtotal,
          maxRedemptions: discount.maxRedemptions,
          startsAt: discount.startsAt,
          endsAt: discount.endsAt,
          isActive: discount.isActive,
        }}
      />
    </div>
  );
}
