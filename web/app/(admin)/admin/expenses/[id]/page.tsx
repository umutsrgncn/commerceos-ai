import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getExpenseById } from "@/lib/queries/expenses";
import { deleteExpenseAction } from "@/lib/actions/expenses";
import { ExpenseForm } from "../components/expense-form";

export const metadata = { title: "Gider — CommerceOS" };

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/expenses"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Giderler
        </Link>

        <form action={deleteExpenseAction}>
          <input type="hidden" name="id" value={expense.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Gider düzenle
        </h1>
      </div>

      <ExpenseForm
        mode="edit"
        initial={{
          id: expense.id,
          date: expense.date,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          vendor: expense.vendor,
          reference: expense.reference,
        }}
      />
    </div>
  );
}
