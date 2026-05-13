/**
 * Agent system prompt'una eklenir.
 *
 * Bu projedeki yaygın patternler ve DOĞRU import path'leri.
 * Agent grep'le aramak zorunda kalmasın — net pattern var.
 */
export const CODEBASE_RECIPES = `YAYGIN PATTERN'LAR (HAFIZAYA AL — grep ile arama, doğrudan kullan):

────────────────────────────────────────
1) PRİSMA DB ERİŞİMİ
────────────────────────────────────────
DOĞRU:   import { db } from "@/lib/db";
YANLIŞ:  import { prisma } from "@/lib/prisma";  ← BÖYLE BİR DOSYA YOK

Kullanım:
  await db.dataRequest.create({ data: { ... } });
  await db.customer.findUnique({ where: { id } });

────────────────────────────────────────
2) MÜŞTERİ AUTH (shop tarafı, server-side)
────────────────────────────────────────
DOĞRU:   import { requireCustomer } from "@/lib/shop/auth";
         const customer = await requireCustomer();  // yoksa redirect
         // customer: { id, email, name, ... }

         import { getCurrentCustomer } from "@/lib/shop/auth";
         const customer = await getCurrentCustomer();  // yoksa null

────────────────────────────────────────
3) ADMIN AUTH (admin tarafı)
────────────────────────────────────────
DOĞRU:   import { auth } from "@/auth";
         const session = await auth();
         // session.user: { email, role: ADMIN | MANAGER | VIEWER }

────────────────────────────────────────
4) SERVER ACTION DÖNÜŞ TİPİ
────────────────────────────────────────
Bu projede merkezi 'ActionResult' utility'si YOKTUR.
Her server action dosyasında tipi INLINE tanımla:

  export type RequestDeletionState =
    | { ok: true; message: string }
    | { ok: false; error: string }
    | null;

YANLIŞ: import { ActionResult } from "@/lib/util/action-result"  ← yok

────────────────────────────────────────
5) REVALIDATE
────────────────────────────────────────
  import { revalidatePath } from "next/cache";
  revalidatePath("/shop/account/settings");
  revalidatePath("/admin/data-requests");

────────────────────────────────────────
6) REDIRECT (server action içinde)
────────────────────────────────────────
  import { redirect } from "next/navigation";
  redirect("/shop/account");

────────────────────────────────────────
7) "use server" PATTERN
────────────────────────────────────────
- Server action dosyaları **dosyanın en üstünde** "use server" ile başlar.
- Bir dosyada hem server component hem client component KARIŞTIRMA.
- Client component'lerde "use client", server action'larda "use server".
- React hook'ları (useState, useFormState, useFormStatus) sadece client component'lerde.

useFormState (form action ile bind):
  import { useActionState } from "react";
  const [state, formAction] = useActionState(myServerAction, null);

useFormStatus (pending state):
  import { useFormStatus } from "react-dom";
  const { pending } = useFormStatus();

────────────────────────────────────────
8) KVKK / HESAP SİLME TALEBİ ÖRNEĞİ
────────────────────────────────────────
DataRequest modeli ZATEN VAR. Admin tarafında /admin/data-requests sayfası da var.
Müşterinin "Hesabımı sil" akışı:

a) Client component (form):
   "use client";
   import { useActionState } from "react";
   import { useFormStatus } from "react-dom";
   import { requestAccountDeletion } from "./actions";

   export function DeleteAccountForm() {
     const [state, action] = useActionState(requestAccountDeletion, null);
     return (
       <form action={action}>
         <textarea name="reason" />
         <SubmitButton />
         {state?.ok && <p>{state.message}</p>}
         {state?.ok === false && <p>{state.error}</p>}
       </form>
     );
   }

b) Server action (./actions.ts):
   "use server";
   import { db } from "@/lib/db";
   import { requireCustomer } from "@/lib/shop/auth";
   import { revalidatePath } from "next/cache";

   type State = { ok: true; message: string } | { ok: false; error: string } | null;

   export async function requestAccountDeletion(
     _prev: State,
     formData: FormData,
   ): Promise<State> {
     const customer = await requireCustomer();
     const reason = (formData.get("reason") as string | null)?.trim() || "Kullanıcı isteği";
     // Zaten bekleyen talep var mı?
     const existing = await db.dataRequest.findFirst({
       where: { email: customer.email, type: "DELETE", status: "PENDING" },
     });
     if (existing) {
       return { ok: false, error: "Zaten bekleyen bir silme talebin var." };
     }
     await db.dataRequest.create({
       data: {
         email: customer.email,
         type: "DELETE",
         reason,
         status: "PENDING",
       },
     });
     revalidatePath("/admin/data-requests");
     return { ok: true, message: "Talebin admin'e iletildi, 7 gün içinde dönüş yapacağız." };
   }

c) Server component (page.tsx):
   import { DeleteAccountForm } from "./delete-account-form";
   ...
   <DeleteAccountForm />

────────────────────────────────────────
9) ÖNEMLİ UYARILAR
────────────────────────────────────────
- Dosya yazma yetkisi seçilen scope'la sınırlı. Scope dışına yazma denerse tool reddeder — alternatif path bul.
- TypeScript hatasız ol — finish öncesi tsc gate var, hatalar var ise düzelt.
- Type tahmin etme — Prisma'nın generated tipi enum/model adlarıdır (DataRequest, DataRequestType, vs.).
`;
