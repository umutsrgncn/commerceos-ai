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
8) KVKK / HESAP SİLME TALEBİ — gerçek schema
────────────────────────────────────────
DataModels listesindeki MODEL ADI ve ALAN ADLARI HER ZAMAN OTORİTEDİR.
"db.dataDeletionRequest" gibi adlar tahmin değil — yukarıdaki listede aynen var.

Müşteri ayarlar → admin onayına talep akışı için:

a) Client component (form): "use client" + useActionState
b) Server action: "use server" + db.<model>.create({...})
c) Server component (page.tsx): formu yerleştir
d) revalidatePath ile admin sayfasını tazele

DOĞRU YAKLAŞIM — pattern yerine yapı:
- Hangi modeli kullanacağını DATA MODELS listesinden seç (yukarıda gerçek schema'dan üretildi).
- Mevcut admin sayfası benzer iş yapıyorsa onun query/mutation kodlarını OKU, alanları kopyala.
- TS hata varsa, model/alan adlarını tahmin etme — schema listesinden veya admin kodundan kopyala.

REFERANSLAR (oku, model + alan adlarını gör):
  web/app/(admin)/admin/data-requests/page.tsx  — admin KVKK panelinin nasıl listelediği
  web/prisma/schema.prisma                       — model + alan + enum tam tanımı

────────────────────────────────────────
9) ÖNEMLİ UYARILAR
────────────────────────────────────────
- Dosya yazma yetkisi seçilen scope'la sınırlı. Scope dışına yazma denerse tool reddeder — alternatif path bul.
- TypeScript hatasız ol — finish öncesi tsc gate var, hatalar var ise düzelt.
- Type tahmin etme — Prisma'nın generated tipi enum/model adlarıdır (DataRequest, DataRequestType, vs.).
`;
