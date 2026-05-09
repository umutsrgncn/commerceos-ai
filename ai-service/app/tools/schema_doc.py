"""Human-readable database schema fed to Gemini as part of the system prompt.

Pulled from prisma/schema.prisma. We give the model just enough — table
names, column names with types, key relationships — without overwhelming
context. Money columns are explicitly flagged as minor units (kuruş).
"""

DATABASE_SCHEMA_DOC = """
Postgres schema (Prisma-generated). Tablo isimleri ÇİFT TIRNAK içinde
yazılmalıdır çünkü Prisma PascalCase kullanır.

-- Authentication
"User" (id, name, email UNIQUE, role text 'ADMIN'|'MANAGER'|'VIEWER',
        hashedPassword, image, "emailVerified", "createdAt", "updatedAt")
"Account", "Session", "VerificationToken"  -- Auth.js, nadiren sorgulanır

-- Catalog
"Category" (id, name, slug UNIQUE, description, "parentId" → "Category".id,
            "createdAt", "updatedAt")
"Product" (id, name, slug UNIQUE, sku UNIQUE, description,
           price INT (kuruş), currency (TRY/USD/EUR),
           status 'DRAFT'|'PUBLISHED'|'ARCHIVED',
           images JSONB, "categoryId" → "Category".id,
           "createdAt", "updatedAt")
"Inventory" (id, "productId" UNIQUE → "Product".id, quantity, reserved,
             "reorderLevel", location, "updatedAt")
"InventoryAdjustment" ("inventoryId" → "Inventory".id, delta INT, reason,
                       note, "userId", "createdAt")

-- Customers
"Customer" (id, name, email UNIQUE, phone, address JSONB, notes,
            "createdAt", "updatedAt")

-- Orders
"Order" (id, "orderNumber" UNIQUE, "customerId" → "Customer".id,
         "createdById" → "User".id,
         status 'PENDING'|'CONFIRMED'|'SHIPPED'|'DELIVERED'|'CANCELLED'|'REFUNDED',
         subtotal INT (kuruş), tax INT, shipping INT, total INT,
         currency, notes, "createdAt", "updatedAt")
"OrderItem" ("orderId" → "Order".id, "productId" → "Product".id,
             name (snapshot), quantity, "unitPrice" INT, total INT)
"Refund" ("orderId" → "Order".id, amount INT (kuruş), reason, status,
          notes, "userId", "createdAt", "updatedAt")

-- Promotions
"Discount" (id, code UNIQUE (büyük harf), description,
            type 'PERCENTAGE'|'FIXED', value INT,
            "minSubtotal" INT, "maxRedemptions", "redemptionCount",
            "startsAt", "endsAt", "isActive", "createdAt", "updatedAt")

-- Audit
"ActivityLog" (id, action (dot.path: 'product.create', 'order.transition'),
               "entityType", "entityId", "userId", "userName",
               metadata JSONB, "createdAt")

"SystemSettings" (id='default' singleton, "companyName", "taxId", address,
                  phone, email, "defaultCurrency", "defaultTaxRate",
                  timezone, "updatedAt")

ÖNEMLİ NOTLAR:
1. Para tutarları INT olarak kuruş (minor unit). 1234 = 12.34 ₺.
2. Tablo ve kolon isimleri ÇİFT TIRNAK ile alıntılanmalı: "Order", "createdAt".
3. Status / type alanları enum string. Karşılaştırırken büyük harfle yaz: status = 'PUBLISHED'.
4. Tarih filtreleri için: "createdAt" >= NOW() - INTERVAL '30 days'
5. JSON kolonlar için: address->>'city' = 'İstanbul' veya images::text ILIKE '%foo%'
6. Türkçe ad araması için ILIKE kullan: name ILIKE '%pamuk%'
7. JOIN'lerde: "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
8. SELECT * yerine ihtiyacın olan kolonları yaz, daha okunur sonuç.
"""
