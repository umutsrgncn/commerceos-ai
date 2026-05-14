"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { requestAccountDeletion } from "./actions";

export type RequestDeletionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

type ActiveRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | string;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

type Customer = { id: string; email: string; name: string };

const KVKK_RIGHTS = [
  "Hangi kişisel verinin işlendiğini öğrenme",
  "İşlenme amacı dışında kullanılıp kullanılmadığını bilme",
  "Eksik veya yanlış verinin düzeltilmesini isteme",
  "Verinin silinmesini veya yok edilmesini isteme",
];

export function DeleteAccountSection({
  customer,
  activeRequest,
}: {
  customer: Customer;
  activeRequest: ActiveRequest | null;
}) {
  if (activeRequest) {
    return <ActiveRequestCard request={activeRequest} />;
  }
  return <RequestForm customer={customer} />;
}

function ActiveRequestCard({ request }: { request: ActiveRequest }) {
  const isPending = request.status === "PENDING";
  const isApproved = request.status === "APPROVED";

  const tone = isApproved
    ? {
        bg: "bg-emerald-500/[0.06]",
        border: "border-emerald-500/30",
        iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        text: "text-emerald-700 dark:text-emerald-300",
      }
    : {
        bg: "bg-amber-500/[0.06]",
        border: "border-amber-500/30",
        iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        text: "text-amber-700 dark:text-amber-300",
      };

  return (
    <div
      className={`rounded-xl border ${tone.border} ${tone.bg} p-5`}
      data-testid="kvkk-active-request"
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone.iconBg}`}>
          {isApproved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </span>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className={`text-sm font-semibold ${tone.text}`}>
              {isApproved
                ? "Talebin onaylandı"
                : "Talebin alındı — yönetici onayı bekleniyor"}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)]">
              {isApproved
                ? "Hesabın ve verilerin yönetici tarafından silinmek üzere işaretlendi. İşlem tamamlandığında bilgilendirileceksin."
                : "Yasal süre 30 gün — yönetici talebine en geç bu süre içinde dönüş yapacak."}
            </p>
          </div>

          <dl className="grid gap-2 rounded-lg bg-[color:var(--color-bg)]/60 p-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Talep tarihi
              </dt>
              <dd className="mt-0.5 font-medium">
                {new Date(request.createdAt).toLocaleString("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            {request.reviewedAt && (
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  İncelenme tarihi
                </dt>
                <dd className="mt-0.5 font-medium">
                  {new Date(request.reviewedAt).toLocaleString("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            )}
          </dl>

          {request.reason && (
            <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Talep gerekçen
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs text-[color:var(--color-fg)]/85">
                {request.reason}
              </p>
            </div>
          )}

          {request.reviewNote && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/[0.05] p-3">
              <div className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                Yönetici notu
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs">
                {request.reviewNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestForm({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<RequestDeletionState, FormData>(
    requestAccountDeletion,
    null,
  );

  // Başarılı submit'ten sonra modal'ı kapat — page revalidate olunca üst component
  // ActiveRequestCard'a geçecek zaten
  if (state?.ok && open) {
    setOpen(false);
  }

  return (
    <>
      {/* KVKK bilgi paneli */}
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]/40 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          KVKK kapsamındaki haklar&#x131;n
        </h3>
        <ul className="mt-3 space-y-1.5 text-xs text-[color:var(--color-fg)]/80">
          {KVKK_RIGHTS.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-accent)]" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Aksiyon */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-[color:var(--color-muted)] sm:max-w-md">
          Hesap silme talebin yöneticiye iletilir. Onaylandığında siparişlerin
          dahil tüm kişisel verin sistemden kalıcı olarak silinir.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
          data-testid="open-delete-modal"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hesabımı sil
        </Button>
      </div>

      {state?.ok === false && (
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
          {state.error}
        </p>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Hesap silme talebi"
        description={`${customer.email} hesabına ait tüm veri silinmek üzere yönetici onayına gönderilecek.`}
        icon={<ShieldAlert className="h-4 w-4" />}
        tone="red"
        size="md"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <SubmitButton formId="kvkk-delete-form" />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/[0.05] p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-700 dark:text-rose-300">
                Bu işlem geri alınamaz
              </p>
              <p className="text-[color:var(--color-muted)]">
                Onaylanırsa siparişlerin, adreslerin ve hesap bilgilerin kalıcı
                olarak silinir.
              </p>
            </div>
          </div>

          <form id="kvkk-delete-form" action={formAction} className="space-y-3">
            <input type="hidden" name="customerId" value={customer.id} />
            <div>
              <Label htmlFor="kvkk-reason" className="text-xs">
                Gerekçe (isteğe bağlı)
              </Label>
              <Textarea
                id="kvkk-reason"
                name="reason"
                rows={4}
                placeholder="Yöneticiye iletilmesini istediğin bir neden varsa buraya yazabilirsin."
                className="mt-1 text-sm"
                data-testid="kvkk-reason-input"
              />
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

function SubmitButton({ formId }: { formId: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      form={formId}
      variant="destructive"
      size="sm"
      disabled={pending}
      data-testid="confirm-delete-btn"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Gönderiliyor…
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          Talebi gönder
        </>
      )}
    </Button>
  );
}
