/**
 * Planner için Prisma model özeti.
 *
 * Bu metin planner system prompt'una eklenir ki agent "şu model var mı?" diye
 * tahmin etmek yerine mevcut yapıyı bilsin. Schema/migration yazılamadığı için
 * her zaman BU modellerle çalışılır.
 *
 * Şema değiştiğinde elle güncellenmesi gerekir.
 */
export const DATA_MODELS_SUMMARY = `Mevcut Prisma modelleri (yeni schema/migration EKLENMEZ — bunları kullan):

Kullanıcı / Müşteri / KVKK:
- User                  — admin paneli kullanıcıları (role: ADMIN/MANAGER/VIEWER)
- Customer              — shop müşterileri (email, name, passwordHash, vipScore, ...)
- Address               — müşteri adresleri
- DataRequest           — KVKK veri silme/erişim talepleri (status: PENDING/APPROVED/REJECTED/COMPLETED, type: DELETE/EXPORT)
- CookieConsent         — çerez izin kayıtları

Katalog / Ürün:
- Product, ProductVariant, Category, Inventory
- Review, WishlistItem
- Discount

Sipariş / Sepet / Ödeme:
- Cart, CartItem
- Order, OrderItem
- Payment

Finans:
- Expense, ScheduledExpense
- BankAccount, BankTransaction
- Invoice, Supplier
- SalesGoal

Sistem / Otopilot:
- ActivityLog           — admin audit trail (bir işlem yaptıysan log düşürebilirsin)
- Notification, Anomaly
- AutopilotEvent

Agent (kendi sistemim — DOKUNMA):
- AgentTask, AgentEvent, AgentScreenshot, AgentTestRun

KRİTİK NOTLAR:
1. Yeni model, yeni alan, yeni migration EKLEME — mevcut alanlar yeterli olduğu sürece görev YAPILABİLİR.
2. "KVKK / hesap silme / veri talebi" istekleri için DataRequest modeli ZATEN HAZIR — yeni schema gerekmez.
3. Customer kaydını DOĞRUDAN SİLMEME — DataRequest oluşturup admin'in onayına bırak.
4. ActivityLog ile audit trail bırakmak iyidir ama zorunlu değil.
5. Mevcut alan yok → o özelliğe yeni alan EKLEMEYE çalışmadan önce mevcut alanları yeniden değerlendir.
   Gerçekten gerekiyorsa o zaman feasible=false, "yeni alan/schema gerekiyor" diye reddet.
`;
