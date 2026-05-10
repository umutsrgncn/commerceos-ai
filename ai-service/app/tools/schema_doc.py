"""Human-readable database schema fed to Gemini as part of the system prompt.

Pulled from prisma/schema.prisma. We give the model just enough — table
names, column names with types, key relationships — without overwhelming
context. Money columns are explicitly flagged as minor units (kuruş).
"""

DATABASE_SCHEMA_DOC = """
Postgres schema (Prisma-generated). Tablo isimleri ÇİFT TIRNAK içinde
yazılmalıdır çünkü Prisma PascalCase kullanır.

═══ AUTH ═══
"User" (id, name, email UNIQUE, role 'ADMIN'|'MANAGER'|'VIEWER',
        hashedPassword, image, "emailVerified", "createdAt", "updatedAt")
"Account", "Session", "VerificationToken"  -- Auth.js, nadiren sorgulanır

═══ CATALOG ═══
"Category" (id, name, slug UNIQUE, description, "parentId" → "Category".id,
            "createdAt", "updatedAt")
"Product" (id, name, slug UNIQUE, sku UNIQUE, description,
           price INT (kuruş), "costPrice" INT? (kuruş, brüt kâr için),
           currency (TRY/USD/EUR),
           status 'DRAFT'|'PUBLISHED'|'ARCHIVED',
           images JSONB, "categoryId" → "Category".id,
           "createdAt", "updatedAt")
"Inventory" (id, "productId" UNIQUE → "Product".id, quantity, reserved,
             "reorderLevel", location, "updatedAt")
"InventoryAdjustment" ("inventoryId" → "Inventory".id, delta INT, reason
             'RESTOCK'|'SALE'|'RETURN'|'LOSS'|'CORRECTION', note, "userId",
             "createdAt")
"ProductReview" (id, "productId" → "Product".id, "authorName", "authorEmail"?,
             rating INT 1-5, body, reply, "repliedAt", "isPublished",
             "createdAt")

═══ CUSTOMERS ═══
"Customer" (id, name, email UNIQUE, phone, address JSONB, notes,
            "createdAt", "updatedAt")

═══ ORDERS ═══
"Order" (id, "orderNumber" UNIQUE, "customerId" → "Customer".id,
         "createdById" → "User".id,
         status 'PENDING'|'CONFIRMED'|'SHIPPED'|'DELIVERED'|'CANCELLED'|'REFUNDED',
         subtotal INT (kuruş), tax INT, shipping INT, total INT,
         currency, notes, "createdAt", "updatedAt")
"OrderItem" ("orderId" → "Order".id, "productId" → "Product".id,
             name (snapshot), quantity, "unitPrice" INT, total INT)
"Refund" ("orderId" → "Order".id, amount INT (kuruş),
          reason 'CUSTOMER_REQUEST'|'DEFECTIVE'|'WRONG_ITEM'|'LATE_DELIVERY'|
                 'CANCELLED'|'OTHER',
          status 'PENDING'|'COMPLETED'|'REJECTED', notes, "userId",
          "createdAt", "updatedAt")

═══ PROMOTIONS ═══
"Discount" (id, code UNIQUE (büyük harf), description,
            type 'PERCENTAGE'|'FIXED', value INT,
            "minSubtotal" INT, "maxRedemptions", "redemptionCount",
            "startsAt", "endsAt", "isActive", "createdAt", "updatedAt")

═══ FİNANS ═══
"Expense" (id, date DateTime, amount INT (kuruş), currency,
           category 'RENT'|'PAYROLL'|'SHIPPING'|'MARKETING'|'SUPPLIES'|
                    'COGS'|'TAXES'|'UTILITIES'|'SOFTWARE'|'TRAVEL'|'OTHER',
           description, vendor?, reference?, "userId", "createdAt", "updatedAt")
"SalesGoal" (id, period UNIQUE 'YYYY-MM', "targetAmount" INT (kuruş),
             notes?, "createdAt", "updatedAt")
"Invoice" (id, "invoiceNumber" UNIQUE 'GIB-YYYYNNNNNNN',
           "orderId" UNIQUE → "Order".id,
           status 'DRAFT'|'SENT'|'ACCEPTED'|'REJECTED'|'CANCELLED',
           "documentType" 'EFATURA' (B2B, kurumsal/VKN'li alıcı) |
                          'EARSIV' (B2C, son tüketici/bireysel),
           "ublXml" TEXT, uuid UNIQUE,
           "totalMinor" INT, "taxMinor" INT, currency,
           mode 'test'|'production', "sentAt", "acceptedAt",
           "cancelledAt", "cancelReason",
           "errorMessage", "createdAt", "updatedAt")
"BankTransaction" (id, "bankName", "accountIban"?, reference?,
                   "transactionDate", "amountMinor" INT (kuruş, +IN/-OUT),
                   currency, description TEXT,
                   direction 'IN' (gelen havale/tahsilat) | 'OUT' (giden),
                   source 'CSV'|'WEBHOOK'|'MANUAL',
                   status 'UNMATCHED'|'AUTO_MATCHED' (AI≥85% eşleştirdi)|
                          'MANUAL_MATCHED' (kullanıcı eşleştirdi)|
                          'IGNORED' (alakasız: komisyon, transfer),
                   "matchedOrderId"? → "Order".id,
                   "matchConfidence"? INT (AI 0-100),
                   "matchReasoning"? TEXT, "matchedAt", "matchedBy",
                   "rawData" JSONB, "createdAt", "updatedAt")

═══ AUDIT & SETTINGS ═══
"ActivityLog" (id, action (dot.path: 'product.create', 'order.transition',
               'expense.create', 'invoice.issued', 'invoice.cancelled',
               'invoice.reissued', 'invoice.failed', 'bank.import',
               'bank.matched', 'review.reply', vb.),
               "entityType", "entityId", "userId", "userName",
               metadata JSONB, "createdAt")
"SystemSettings" (id='default' singleton, "companyName", "taxId", address,
                  phone, email, "defaultCurrency", "defaultTaxRate",
                  timezone, "gibMode" 'test'|'production',
                  "gibIntegratorUrl", "gibUsername",
                  "gibPasswordEncrypted", "gibSenderAlias", "updatedAt")

ÖNEMLİ NOTLAR:
1. Para tutarları INT olarak kuruş (minor unit). 1234 = 12.34 ₺.
2. Tablo ve kolon isimleri ÇİFT TIRNAK: "Order", "createdAt".
3. Enum'lar UPPERCASE string olarak karşılaştırılır: status = 'PUBLISHED'.
4. Tarih filtreleri: "createdAt" >= NOW() - INTERVAL '30 days'
5. JSON kolonlar için: address->>'city' = 'İstanbul'
6. Türkçe arama: name ILIKE '%pamuk%'
7. JOIN: "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"

ÖRNEK SORGULAR (sıkça sorulur):
- Net kâr (bir ay): SELECT (SUM(o.total) - COALESCE(SUM(r.amount),0)) -
  COALESCE(SUM(e.amount),0) AS net FROM ... (gelir−iade−gider)
- En kârlı ürün: SELECT p.name, AVG(p.price - COALESCE(p."costPrice",0))
  AS margin FROM "Product" p WHERE p."costPrice" IS NOT NULL ORDER BY margin DESC
- Aylık hedef vs gerçekleşen: g."targetAmount" ile bu ay sipariş toplamını
  karşılaştır
- Bu ay gider kategorisi dağılımı: GROUP BY category WITH date_trunc month
- Kesilen e-faturalar: SELECT * FROM "Invoice" WHERE status='ACCEPTED'
- E-Fatura vs E-Arşiv dağılımı: SELECT "documentType", COUNT(*),
  SUM("totalMinor") FROM "Invoice" WHERE status='ACCEPTED' GROUP BY "documentType"
- İptal edilen faturalar: SELECT * FROM "Invoice" WHERE status='CANCELLED'
  ORDER BY "cancelledAt" DESC
- Reddedilen faturalar (sebep dahil): SELECT "invoiceNumber", "errorMessage",
  "createdAt" FROM "Invoice" WHERE status='REJECTED'
- Eşleşmemiş havaleler: SELECT * FROM "BankTransaction"
  WHERE status='UNMATCHED' AND direction='IN' ORDER BY "transactionDate" DESC
- Bu ay tahsilat (banka): SELECT SUM("amountMinor") FROM "BankTransaction"
  WHERE direction='IN' AND "transactionDate" >= date_trunc('month', NOW())
- AI eşleştirme oranı: SELECT
    SUM(CASE WHEN status IN ('AUTO_MATCHED','MANUAL_MATCHED') THEN 1 ELSE 0 END)
    * 100.0 / COUNT(*) AS rate FROM "BankTransaction" WHERE direction='IN'
- Hangi siparişin ödemesi geldi: JOIN "Order" o ON o.id = bt."matchedOrderId"
  WHERE bt.status IN ('AUTO_MATCHED','MANUAL_MATCHED')
"""
