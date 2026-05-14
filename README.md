<div align="center">

# CommerceOS

### AI yöneticili Türk e-ticaret yönetim paneli

Otopilot 7 farklı işi paralel yönetir. AI Geliştirici doğal dilden kod yazar.
Veritabanıyla Türkçe konuşursun, grafiklerle cevap döner.
Tek panel — sipariş, ürün, müşteri, finans, KVKK, GİB, PayTR.

[**🌐 Canlı demo · commerceos.cloud**](https://commerceos.cloud) · [▶ Tanıtım](https://commerceos.cloud/watch) · [🎯 Admin panel](https://commerceos.cloud/login)

`demo@commerceos.dev` / `demo1234`

![Hackathon](https://img.shields.io/badge/Hackathon-fatal_exception_team-fuchsia)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Pro+Flash-4285F4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

<br />

![CommerceOS Dashboard](https://commerceos.cloud/team/shot-dashboard-dark.jpg)

</div>

---

## 🚀 Bir bakışta

CommerceOS, Türk e-ticaret operasyonunu **AI yönettiği** bir admin paneldir. Üç ana yetenek:

1. **AI Geliştirici (flagship)** — Doğal dilden görev yaz → agent planlar, kodlar, test eder, önizleme açar, sen onaylarsın.
2. **Otopilot** — 7 farklı operasyonel işi paralel yönetir: yorum cevabı, e-fatura, stok sipariş, havale eşleştirme, fiyat, segment, anomali.
3. **Veritabanıyla Konuş** — Türkçe sor, AI read-only Postgres'e SQL atıp Türkçe yanıt ve grafik döndürür.

Tümü **Pamuk** isimli demo bir tekstil markası üzerinden çalışır — 40 ürün, 85 müşteri, ~310 sipariş, banka, fatura, yorumlar — tamamı dolu canlı veriyle.

---

## ✨ Flagship — "Sen düşün. AI kodlasın."

![AI Geliştirici](https://commerceos.cloud/team/shot-agent-dark.jpg)

Admin panelden bir kutuya doğal dilde görev yazarsın ("şu sayfaya şu butonu ekle"). Sonrasını agent yapar:

```mermaid
flowchart LR
  user[👤 Görev:<br/>'şu butonu ekle'] --> plan
  plan[🧠 Plan<br/>Gemini 2.5 Pro<br/>scope + adımlar] --> code
  code[📝 Yaz<br/>Gemini 2.5 Flash<br/>tool-use loop] --> verify
  verify[🛡️ Doğrula<br/>tsc + RSC + e2e] --> ship
  ship[🚀 Yayınla<br/>Cloudflared tunnel] --> review[👤 Onay/Red]
  review -->|onay| merged[✅ main'e merge]
  review -->|red| dropped[🗑️ atıldı]

  style plan fill:#6366f1,stroke:#312e81,color:#fff
  style code fill:#d946ef,stroke:#86198f,color:#fff
  style verify fill:#10b981,stroke:#065f46,color:#fff
  style ship fill:#f59e0b,stroke:#92400e,color:#fff
  style merged fill:#10b981,stroke:#065f46,color:#fff
  style dropped fill:#ef4444,stroke:#7f1d1d,color:#fff
```

| Aşama | Model | Görev |
|---|---|---|
| **Plan** | Gemini 2.5 Pro | Görevi triage eder, scope seçer, adımları çıkarır. Anlamsız ya da güvenlik riskli ise burada reddeder. |
| **Yaz** | Gemini 2.5 Flash | Function-calling tool-use döngüsü: `list_dir`, `read_file`, `edit_file`, `write_file`. Komponent kataloğunu önden bilir, halüsinasyon yapmaz. |
| **Doğrula** | tsc + RSC lint + e2e | TypeScript hatasız mı? Server/client karışmamış mı? Playwright spec'leri geçiyor mu? Yeşilden bir tanesi bile değilse `finish` reddedilir. |
| **Yayınla** | Cloudflared tunnel | İzole branch'te commit + önizleme tüneli. Sen onayla → main'e merge. Reddet → dosyalar atılır. |

> 23 yazılabilir scope · 67 e2e Playwright spec · %100 izole git worktree
>
> Güvenlik: `prisma/`, `auth/`, `middleware/`, `.env` her zaman korumalı — agent yazamaz.

---

## 🤖 Otopilot — 7 paralel iş

Otopilot her açıldığında **7 görev paralel** koşar. Bütçe limiti ve güven eşiği admin'in kontrolünde, audit log her aksiyona düşer.

![Otopilot panel](https://commerceos.cloud/team/shot-autopilot-dark.jpg)

```mermaid
flowchart TD
  trigger((🔔 Event<br/>tetik)) --> review[💬 Yorum<br/>cevabı]
  trigger --> invoice[🧾 E-fatura<br/>otomatik kes]
  trigger --> stock[📦 Stok<br/>tedarikçi maili]
  trigger --> bank[🏦 Havale<br/>eşleştir]
  trigger --> segment[👥 Müşteri<br/>segment]
  trigger --> price[🏷️ Fiyat<br/>önerisi]
  trigger --> anomaly[⚠️ Anomali<br/>tespit]

  review --> log[(📋 Audit log)]
  invoice --> log
  stock --> log
  bank --> log
  segment --> log
  price --> log
  anomaly --> log

  style trigger fill:#d946ef,stroke:#86198f,color:#fff
  style log fill:#1f2937,stroke:#374151,color:#9ca3af
```

| # | Görev | Tetik | AI Aksiyon | Örnek çıktı |
|---|---|---|---|---|
| 1 | **Müşteri yorumu cevabı** | Yeni yorum girer | Marka diliyle Türkçe cevap (14sn, %92 güven) | _"Aslı Hanım, geri bildirim için teşekkürler. İade için 30 gün süreniz..."_ |
| 2 | **E-fatura kesimi** | Sipariş `CONFIRMED` | GİB e-arşiv UBL-TR 1.2 gönderir | `EAR2026000448 · UUID + acceptedAt` |
| 3 | **Kritik stok tedarikçi maili** | Stok eşiği altına düşer | Türkçe sipariş maili yazıp gönderir | _"50 adet PT-ESOFMAN için yeniden sipariş..."_ |
| 4 | **Banka havale eşleştirme** | Bank tx ingest | Sipariş referansını semantic match | `₺2.116,92 → ORD-202605-00458` (%97 güven) |
| 5 | **Müşteri segmentasyonu** | Yeni sipariş | VIP / sadık / risky + Türkçe gerekçe | _"13 sipariş / 7 günde → VIP"_ |
| 6 | **Yavaş ürüne fiyat önerisi** | 90+ gün satışsız | Rekabet + maliyet → indirim | `₺249,90 → ₺199,00 (-%20)` |
| 7 | **Anomali tespiti** | Saatlik metrik tarama | Sapma açıklaması + aksiyon önerisi | _"İade oranı %5→%14, bahar koleksiyonunda yoğun"_ |

### Otopilot iç akış

```mermaid
flowchart LR
  event[Olay<br/>yorum/sipariş/stok] --> ai[Gemini 2.5<br/>güven skoru]
  ai -->|eşik üstü| auto[Otomatik aksiyon]
  ai -->|eşik altı| review[Admin onayı bekler]
  auto --> exec[DB · GİB · SMTP]
  review -->|✅ onay| exec
  review -->|❌ red| skip[İptal]
  exec --> log[(Audit log<br/>geri alınabilir)]

  style event fill:#d946ef,stroke:#86198f,color:#fff
  style ai fill:#6366f1,stroke:#312e81,color:#fff
  style auto fill:#10b981,stroke:#065f46,color:#fff
  style review fill:#f59e0b,stroke:#92400e,color:#fff
  style exec fill:#06b6d4,stroke:#0e7490,color:#fff
```

---

## 🔎 Veritabanıyla Konuş — Doğal dilden grafik

Asistan PostgreSQL'e **read-only kullanıcı** ile doğrudan SQL atar — `Order`, `Customer`, `Product`, `Inventory`, `Invoice`, `Review`, `BankTransaction`, `Refund` tablolarına erişir. Türkçe cevap + **grafik render** eder.

```mermaid
sequenceDiagram
  autonumber
  participant U as 👤 Yönetici
  participant Web as Next.js
  participant AI as FastAPI<br/>(Gemini 2.5)
  participant DB as Postgres<br/>(read-only user)

  U->>Web: "Son 7 gün en çok satan 3 ürün?"
  Web->>AI: POST /chat { query, schema_context }
  AI->>AI: 🧠 SQL üret + güvenlik kontrolü<br/>(yalnız SELECT, kullanıcı = read-only)
  AI->>DB: SELECT name, SUM(quantity), SUM(total) ...
  DB-->>AI: 3 satır
  AI->>AI: 📊 Sonucu Türkçe yorumla + chart spec üret
  AI-->>Web: { text, sql, chart: { type, data } }
  Web-->>U: 💬 Türkçe cevap + grafik kart
```

### 🧪 Demo sorgu #1 — Top ürünler (bar chart)

> 💬 **Kullanıcı:** "Bu hafta en çok satan 3 ürünü ciroyla beraber söyler misin?"

<details>
<summary>📜 AI'ın ürettiği SQL (oku → kapat)</summary>

```sql
SELECT p.name, SUM(oi.quantity) AS qty, SUM(oi.total) AS revenue
FROM "OrderItem" oi
JOIN "Product"   p ON p.id = oi."productId"
JOIN "Order"     o ON o.id = oi."orderId"
WHERE o."createdAt" >= NOW() - INTERVAL '7 days'
  AND o.status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY p.name
ORDER BY revenue DESC
LIMIT 3;
```

</details>

> 💬 **AI:** Bu hafta en çok satanlar — toplam ciro **₺45.155** _(geçen haftadan %18 yüksek)_:

```mermaid
xychart-beta
  title "Top 3 ürün — son 7 günlük ciro (₺)"
  x-axis ["Pamuk Basic Tişört", "Eşofman Altı Gri", "Spor Sweatshirt"]
  y-axis "Ciro (₺)" 0 --> 20000
  bar [11703, 18962, 14490]
```

| # | Ürün | Adet | Ciro |
|---|---|---:|---:|
| 1 | Pamuk Basic Tişört | 47 | ₺11.703 |
| 2 | Eşofman Altı Gri | 38 | ₺18.962 |
| 3 | Spor Sweatshirt | 29 | ₺14.490 |

---

### 🧪 Demo sorgu #2 — 5 aylık ciro trendi (line chart)

> 💬 **Kullanıcı:** "Son 5 ayın ciro trendini grafikle göster."

```mermaid
xychart-beta
  title "Aylık ciro trendi (₺ bin)"
  x-axis ["Ara 2025", "Oca 2026", "Şub 2026", "Mar 2026", "Nis 2026", "May 2026"]
  y-axis "Ciro (₺ bin)" 0 --> 250
  line [82, 124, 156, 178, 215, 195]
  bar  [82, 124, 156, 178, 215, 195]
```

> 💬 **AI:** Ciro her ay büyüdü — Aralık ₺82bin → Nisan ₺215bin (**+162%**). Mayıs daha sürüyor (₺195bin / 13 gün), beklenen toplam **₺240bin**. En büyük büyüme Mart→Nisan'da (%21).

---

### 🧪 Demo sorgu #3 — Sipariş durum dağılımı (pie chart)

> 💬 **Kullanıcı:** "Mevcut siparişlerin durum dağılımı nasıl?"

```mermaid
pie showData
  title Sipariş status dağılımı (toplam 310)
  "DELIVERED" : 125
  "SHIPPED"   : 64
  "PENDING"   : 54
  "CONFIRMED" : 38
  "REFUNDED"  : 17
  "CANCELLED" : 12
```

> 💬 **AI:** Toplam **310 sipariş**. Sağlıklı dağılım — DELIVERED %40, SHIPPED %21, aktif (PENDING + CONFIRMED) %30. İade oranı **%5,5** (normal aralıkta), iptal **%3,9**. Bahar koleksiyonu beden tablosu güncellemesi sonrası iade trendine bakman önerilir.

---

### 🧪 Demo sorgu #4 — Stok kontrol + aksiyon önerisi

> 💬 **Kullanıcı:** "Eşofman altının stoğu nasıl, sipariş açmalı mıyım?"

<details>
<summary>📜 AI'ın ürettiği SQL</summary>

```sql
SELECT i.quantity, p.name, p.sku
FROM "Inventory" i
JOIN "Product" p ON p.id = i."productId"
WHERE p.sku = 'PT-ESOFMAN-ALTI-GRI-193';
```

</details>

> 💬 **AI:** `PT-ESOFMAN-ALTI-GRI-193`: **3 adet** stok kaldı 🔴 (kritik). Tedarikçinde 5 iş günü teslim süresi var. Otopilot'tan onaylarsan AI tedarikçiye sipariş maili yazabilir — son 30 günde 38 adet satıldı, **50 adet** sipariş önerisi.

### Güvenlik kuralları

| Katman | Koruma |
|---|---|
| **DB kullanıcı** | `commerceos_readonly` — sadece `GRANT SELECT` izni |
| **SQL filtresi** | DDL/DML reddedilir (`DROP`, `DELETE`, `UPDATE`, `INSERT` blok) |
| **Schema awareness** | AI sadece `Order`, `Customer`, `Product`, `Inventory`, `Invoice`, `Review`, `BankTransaction`, `Refund` tablolarına bakar — User, AuthSession, ApiKey **görmez** |
| **Row limit** | `LIMIT 200` zorunlu, timeout 8sn |
| **Audit** | Her sorgu Redis'e loglanır |

---

## 📸 Görsel turne

<table>
<tr>
<td width="50%">

**Yönetici dashboard (light mode)**

![Dashboard](https://commerceos.cloud/team/shot-dashboard.jpg)

</td>
<td width="50%">

**AI Geliştirici görev listesi**

![Agent](https://commerceos.cloud/team/shot-agent.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Banka hareketleri (AI eşleştirme)**

![Bank](https://commerceos.cloud/team/shot-bank-dark.jpg)

</td>
<td width="50%">

**Sipariş yönetimi**

![Orders](https://commerceos.cloud/team/shot-orders.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Ürün yönetimi**

![Products](https://commerceos.cloud/team/shot-products.jpg)

</td>
<td width="50%">

**Müşteri segmentasyonu**

![Customers](https://commerceos.cloud/team/shot-customers.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Finans + kâr/zarar**

![Finance](https://commerceos.cloud/team/shot-finance.jpg)

</td>
<td width="50%">

**Analitik trendler**

![Analytics](https://commerceos.cloud/team/shot-analytics-dark.jpg)

</td>
</tr>
<tr>
<td width="50%">

**KVKK veri silme talepleri**

![Data Requests](https://commerceos.cloud/team/shot-data-requests.jpg)

</td>
<td width="50%">

**Gelecek ödemeler**

![Scheduled](https://commerceos.cloud/team/shot-scheduled.jpg)

</td>
</tr>
</table>

### 🛒 Shop (Pamuk markası)

<table>
<tr>
<td width="50%">

**Mağaza ana sayfa**

![Shop Home](https://commerceos.cloud/team/shot-shop-home.jpg)

</td>
<td width="50%">

**Ürün detay**

![Shop Product](https://commerceos.cloud/team/shot-shop-product.jpg)

</td>
</tr>
</table>

---

## 🧠 AI Asistan & Araçlar

Sayfanın istediğin yerinde AI tek tık uzaklıkta:

- **🔎 Veritabanı ile Türkçe konuş** _(yukarıdaki ana özellik)_
- **📸 Fiş OCR → otomatik gider** — Fişi fotoğrafla, AI tarih/tutar/KDV/kategori doldurur (6sn)
- **📝 Ürün açıklaması yazımı** — Başlık + öneriler → SEO copy (Gemini streaming, 8sn)
- **🎨 Ürün görseli üretimi** — Prompt → 3 stil varyant
- **✉️ Kampanya yazımı** — Segment + ton → kişiselleştirilmiş e-posta
- **💬 Sipariş mesaj önerisi** — Sipariş bağlamı → cevap taslağı (WhatsApp/SMS/e-posta)
- **📊 Satış içgörüleri** — Dönem stats → AI bullet madde
- **⭐ Yorum sentiment & flag** — Negatif → otomatik özür + iade workflow
- **🏷️ Yavaş ürünlere fiyat taraması** — Toplu AI fiyat önerisi

---

## 🇹🇷 Türkiye altyapısı

| Entegrasyon | Açıklama |
|---|---|
| **KVKK** | Veri silme talepleri akışı (`/shop/account/settings` → admin onayı), çerez yönetimi, AI ile gizlilik metni üretimi |
| **GİB** | E-fatura / e-arşiv UBL-TR 1.2 XML, otopilot otomatik gönderim |
| **PayTR** | 3DS sandbox + production, callback handler |
| **Banka** | EFT/havale CSV import + AI semantik eşleştirme (Garanti BBVA, İş Bankası, Yapı Kredi, Akbank) |
| **Kargo** | Çoklu kurye desteği (carrier alanı), tracking number |

---

## 🧱 Teknoloji yığını

<table>
<tr>
<td valign="top">

**Framework & runtime**
- Next.js 15 (App Router)
- React 19 (Server Components)
- TypeScript 5.7
- Node 22 LTS
- Auth.js v5

**Veri katmanı**
- PostgreSQL 16
- Prisma ORM 6
- Redis 7

</td>
<td valign="top">

**AI servisi (FastAPI)**
- Python 3.12
- FastAPI 0.115
- google-genai SDK
- asyncpg

**Yapay zeka**
- Gemini 2.5 Pro (planner)
- Gemini 2.5 Flash (agent loop)

</td>
<td valign="top">

**UI / motion**
- Tailwind CSS v4
- Motion 11
- GSAP 3
- Lucide / Tabler ikonları
- Aceternity UI bileşenleri

**Test & DX**
- Vitest (unit)
- Playwright (e2e — 67 spec)
- pytest (Python)

</td>
</tr>
</table>

---

## 🏗️ Mimari

```mermaid
flowchart TB
  subgraph web["🌐 web/  (Next.js 15)"]
    shop["/shop  Pamuk markası<br/>Müşteri akışı, sepet"]
    admin["/admin  Yönetici paneli<br/>20+ modül"]
    agentpage["/admin/agent  AI Geliştirici"]
    sa[["Server Components<br/>+ Server Actions"]]
    shop --- sa
    admin --- sa
    agentpage --- sa
  end

  subgraph data["📊 Veri katmanı"]
    pg[(PostgreSQL 16<br/>public schema)]
    pgro[(read-only user)]
    redis[(Redis 7<br/>cache)]
    pg --- pgro
  end

  subgraph ai["🧠 AI servisi (FastAPI :8000)"]
    chat["/chat — DB ile konuş"]
    insights["/insights — satış analizi"]
    kvkk["/kvkk — gizlilik metni"]
    gemini["Gemini 2.5 Pro+Flash"]
  end

  subgraph agent["🤖 AI Geliştirici worker"]
    runner["runner.ts<br/>tool-use loop"]
    worktree["git worktree<br/>izole branch"]
    gates["tsc + RSC + e2e<br/>gate"]
    tunnel["Cloudflared tunnel<br/>önizleme URL"]
    runner --- worktree --- gates --- tunnel
  end

  sa <-->|Prisma| pg
  sa -->|API| ai
  pgro -->|SELECT| chat
  ai --> gemini
  ai <--> redis
  agentpage <--> agent
  agent -->|commit| pg

  style web fill:#1f2937,stroke:#374151,color:#fff
  style data fill:#0c4a6e,stroke:#0369a1,color:#fff
  style ai fill:#831843,stroke:#be185d,color:#fff
  style agent fill:#581c87,stroke:#7c3aed,color:#fff
```

**Üç ayrı süreç:**

1. **`commerceos-web`** — Next.js 15 dev/prod server (port 3000)
2. **`commerceos-ai`** — FastAPI AI servisi (port 8000, Gemini API + Postgres read-only)
3. **`commerceos-agent`** — AI Geliştirici worker daemon (tsx, görev pollar)

---

## 🚀 Çalıştırma

### Hızlı yol — Docker Compose ile (önerilen)

```bash
# 1) Repo'yu klonla
git clone https://github.com/umutsrgncn/commerceos-ai.git
cd commerceos-ai

# 2) Postgres + Redis + AI service'i başlat
cp ai-service/.env.example ai-service/.env  # GEMINI_API_KEY ekle
docker compose up -d postgres redis ai-service

# 3) Web tarafı (yerel Node ile)
cd web
cp .env.example .env.local                # DATABASE_URL, GEMINI_API_KEY ekle
pnpm install
pnpm prisma migrate deploy
pnpm db:seed                              # 5 ürün, 3 sipariş — küçük demo
# pnpm tsx --env-file=.env.local prisma/seed-pamuk-production.ts  # kapsamlı
pnpm build && pnpm start
```

`http://localhost:3000` — Demo girişi: `demo@commerceos.dev` / `demo1234`

### Tam manuel kurulum

#### Ön gereksinimler
- Node 22 LTS, pnpm 9
- PostgreSQL 16, Redis 7
- Python 3.11+
- Gemini API key — [aistudio.google.com](https://aistudio.google.com/app/apikey)

#### Adımlar

```bash
# A) Postgres + Redis
sudo apt install postgresql-16 redis-server
sudo -u postgres psql -c "CREATE USER commerceos WITH PASSWORD 'commerceos';"
sudo -u postgres psql -c "CREATE DATABASE commerceos OWNER commerceos;"
# Read-only kullanıcı (AI servisi için)
sudo -u postgres psql -d commerceos < db/init/01-readonly-user.sql

# B) Web app
cd web
pnpm install
cat > .env.local <<EOF
DATABASE_URL="postgresql://commerceos:commerceos@localhost:5432/commerceos?schema=public"
AUTH_SECRET="$(openssl rand -base64 48)"
AUTH_TRUST_HOST=true
GEMINI_API_KEY=AIza...your-key
GEMINI_AGENT_MODEL=gemini-2.5-flash
GEMINI_PLANNER_MODEL=gemini-2.5-pro
AI_SERVICE_URL=http://127.0.0.1:8000
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
EOF
cp .env.local .env  # Prisma için
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed

# C) AI servisi (FastAPI)
cd ../ai-service
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install .
cat > .env <<EOF
GEMINI_API_KEY=AIza...your-key
GEMINI_MODEL=gemini-2.5-flash
REDIS_URL=redis://localhost:6379
READONLY_DATABASE_URL=postgresql://commerceos_readonly:readonly_pwd_2026@localhost:5432/commerceos
EOF
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# D) Web başlat
cd ../web
pnpm dev   # veya pnpm build && pnpm start
```

#### AI Geliştirici (agent worker — opsiyonel)

```bash
cd web
pnpm agent:worker
```

Web çalışırken bu daemon arka planda `/admin/agent`'tan gelen yeni görevleri poll eder, izole git worktree'de çalıştırır.

#### Production'a seed — Pamuk markası (40 ürün + 310 sipariş)

```bash
SEED_FORCE=1 pnpm tsx --env-file=.env.local prisma/seed-pamuk-production.ts
SEED_FORCE=1 pnpm tsx --env-file=.env.local prisma/seed-scheduled-and-agent.ts
```

> ⚠️ Bu script DB'yi siler ve baştan kurar. Sadece test/demo'da kullan.

---

## 🧪 Test çalıştırma

```bash
# E2E — Playwright (67 spec)
pnpm test:e2e                        # hepsi
pnpm test:e2e tests/e2e/specs/kvkk  # bir klasör

# Unit — Vitest
pnpm test

# Type check
pnpm typecheck

# Python AI servisi
cd ai-service
pytest
```

---

## 📁 Dizin yapısı

```
commerceos-ai/
├── web/                              # Next.js 15 ana uygulama
│   ├── app/
│   │   ├── page.tsx                  # Landing
│   │   ├── watch/                    # Tanıtım video + flagship
│   │   ├── shop/                     # Pamuk mağazası
│   │   ├── (admin)/admin/            # Yönetici paneli (20+ modül)
│   │   ├── (auth)/login/             # Auth
│   │   └── api/                      # API route'ları
│   ├── components/
│   │   ├── landing/                  # Landing component'leri
│   │   ├── aceternity/               # Animasyonlu UI
│   │   └── ui/                       # Modal, Button, Card, ...
│   ├── lib/
│   │   ├── agent/                    # AI Geliştirici (40+ dosya)
│   │   │   ├── runner.ts             # Tool-use loop
│   │   │   ├── tools.ts              # 5 tool tanımı
│   │   │   ├── compact.ts            # History compaction
│   │   │   ├── tsc-gate.ts           # TypeScript gate
│   │   │   ├── e2e-gate.ts           # Playwright gate
│   │   │   └── ...
│   │   ├── shop/                     # Mağaza queries
│   │   ├── autopilot/                # Otopilot motoru
│   │   └── actions/                  # Server Actions
│   ├── prisma/
│   │   ├── schema.prisma             # ~40 model
│   │   ├── seed.ts                   # Küçük demo
│   │   └── seed-pamuk-production.ts  # 40 ürün + 310 sipariş
│   └── tests/e2e/                    # 67 Playwright spec
│
├── ai-service/                       # FastAPI AI servisi
│   └── app/
│       ├── main.py
│       └── routers/                  # /chat, /insights, /kvkk, ...
│
├── db/
│   └── init/01-readonly-user.sql     # AI için read-only DB user
│
└── docker-compose.yml                # Postgres + Redis + AI
```

---

## 👥 Ekip

<table>
<tr>
<td align="center" width="50%">

<a href="https://github.com/umutsrgncn">
<img src="https://commerceos.cloud/team/umut.jpg" width="100" height="100" style="border-radius:50%" />
<br />
<b>Umut Sargıncan</b>
</a>
<br />
Full-stack & AI
<br />
<a href="https://github.com/umutsrgncn">@umutsrgncn</a>

</td>
<td align="center" width="50%">

<a href="https://github.com/cigdemkilic">
<img src="https://commerceos.cloud/team/cigdem.jpg" width="100" height="100" style="border-radius:50%" />
<br />
<b>Çiğdem Kılıç</b>
</a>
<br />
Full-stack & UI
<br />
<a href="https://github.com/cigdemkilic">@cigdemkilic</a>

</td>
</tr>
</table>

`fatal exception team` · 2026 hackathon

---

<div align="center">

**[🌐 commerceos.cloud](https://commerceos.cloud) · [▶ Tanıtımı izle](https://commerceos.cloud/watch) · [⭐ GitHub'da yıldız ver](https://github.com/umutsrgncn/commerceos-ai)**

</div>
