<div align="center">

# CommerceOS

### AI yöneticili Türk e-ticaret yönetim paneli

Otopilot 7 farklı işi paralel yönetir. AI Geliştirici doğal dilden kod yazar.
Veritabanıyla Türkçe konuşursun, grafiklerle cevap döner.
Tek panel — sipariş, ürün, müşteri, finans, KVKK, GİB, iyzico.

[**🌐 Canlı demo · commerceos.cloud**](https://commerceos.cloud) · [▶ Tanıtım](https://commerceos.cloud/watch) · [🎯 Admin panel](https://commerceos.cloud/login)

`demo@commerceos.dev` / `demo1234`

![Hackathon](https://img.shields.io/badge/Hackathon-fatal_exception_team-fuchsia)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Pro-4285F4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

<br />

![CommerceOS Dashboard](https://commerceos.cloud/team/simple.png)

</div>

---

## 🚀 Bir bakışta

CommerceOS, Türk e-ticaret operasyonunu **AI yönettiği** bir admin paneldir. Dört ana yetenek:

1. **AI Geliştirici (flagship)** — Doğal dilden görev yaz → agent planlar, kodlar, test eder, önizleme açar, sen onaylarsın.
2. **Otopilot** — 7 farklı operasyonel işi paralel yönetir: yorum cevabı, e-fatura, stok sipariş, havale eşleştirme, fiyat, segment, anomali.
3. **Veritabanıyla Konuş** — Türkçe sor, AI read-only Postgres'e SQL atıp Türkçe yanıt ve grafik döndürür.
4. **Finans AI — Nakit akışı tahmini** — 30/60/90 günlük gelir-gider forecast'i; scheduled ödemeler (maaş, kira, abonelik) + bekleyen siparişler ile gerçek bakiye projeksiyonu, eksiye düşeceğin günler için erken uyarı.

Tümü **Pamuk** isimli demo bir tekstil markası üzerinden çalışır — 40 ürün, 85 müşteri, ~310 sipariş, banka, fatura, yorumlar — tamamı dolu canlı veriyle.

---

## ✨ Flagship — "Sen düşün. AI kodlasın."

![AI Geliştirici](https://commerceos.cloud/team/shot-agent-dark.jpg)

Admin panelden bir kutuya doğal dilde görev yazarsın ("şu sayfaya şu butonu ekle"). Sonrasını agent yapar:

![AI Geliştirici akışı](web/public/team/diagrams/01-agent-flow.png)

| Aşama | Görev |
|---|---|
| **Plan + Yaz** | Gemini 2.5 Pro. Kodu okur, planı çıkarır, tek bir tool-use döngüsünde edit eder. AGENTS.md project context'i (App Router server/client kuralları, repo pattern örnekleri) her task'a önden yüklenir. |
| **Doğrula** | TSC build gate. Agent bittiğinde değişen dosyalarda `tsc --noEmit` koşar; hata varsa Gemini'ye hata listesini geri besler — max 3 düzeltme denemesi, geçemezse `FAILED` (main'e dokunmaz). |
| **Önizle** | Cloudflared tunnel. İzole git worktree'de dev server açılır, geçici public URL üretilir; gerçek tarayıcıda davranışı görürsün. |
| **Onay** | Onayla → main'e merge + canlı servis restart. Reddet → branch + worktree silinir. |

> 67 e2e Playwright spec · %100 izole git worktree · agent commit author `CommerceOS-Agent-Project-Feature`

### 🛠️ Mimari hikâyesi

İlk versiyonda kendi custom tool-use loop'umuzu yazdık (~5700 satır TypeScript): scope yöneticisi, planner-agent ayrımı, function-calling tool seti, sticky context, signature gate, e2e gate. Başarı oranı **~%70**'di — basit task'larda çalışıyordu ama uzun refactor'larda halüsinasyon, micro-edit döngüsü, duplicate key yazma gibi sorunlar tekrarlıyordu.

İkinci versiyonda olgun bir tool-use motorunu **Gemini 2.5 Pro** ile birleştirdik. Custom altyapımızın iskeletini (worktree, preview, review, merge, audit, commit policy) koruduk; "kod yazma" beynini bu motorla Pro modeline devrettik. Sonuç — başarı oranı belirgin yükseldi, halüsinasyon dropladı, kod hâlâ **Gemini servisi** ile yazılıyor, sadece çok daha kararlı bir döngüyle.

---

## 🤖 Otopilot — 7 paralel iş

Otopilot her açıldığında **7 görev paralel** koşar. Bütçe limiti ve güven eşiği admin'in kontrolünde, audit log her aksiyona düşer.

![Otopilot panel](https://commerceos.cloud/team/shot-autopilot-dark.jpg)

![Otopilot 7 paralel iş](web/public/team/diagrams/02-autopilot-fanout.png)

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

![Otopilot karar akışı](web/public/team/diagrams/03-autopilot-inner.png)

---

## 🧠 AI Asistan & Araçlar

Sayfanın istediğin yerinde AI tek tık uzaklıkta. Toplam **11 ayrı AI özelliği** — finans tarafında 4 tanesi gerçek dataya bağlı, Gemini 2.5 Pro ile yorumlanıyor.

### Finans AI

- **💸 Nakit akışı tahmini** — Son N günlük gelir + gider + scheduled ödemeler (maaş, kira, abonelik) + bekleyen siparişler birleşip 30/60/90 günlük forecast. Eksiye düşeceğin günler için **erken uyarı** (severity + tarih + öneri). Gemini sebebini Türkçe açıklar.
- **📈 Turnaround planı** — Düşen KPI'larda (ciro, dönüşüm, ortalama sepet) AI Türkçe action plan üretir: hangi kategoriye kampanya, hangi yavaş ürünü indirim, hangi maliyet kalemi gözden geçirilmeli.
- **💡 Finans içgörüleri** — Finans dashboard'unda nakit, kâr/zarar, gider eğilimi → AI bullet madde özet (3-5 satır).
- **⚠️ Anomali tarama** — Saatlik metrik tarama: iade oranı sıçraması, beklenmedik gider, banka çıkışı vs. anomali tespiti + sebep tahmini.

### Operasyon AI

- **🔎 Veritabanı ile Türkçe konuş** _(aşağıdaki ana özellik)_ — Read-only Postgres üzerinden SQL + Türkçe + grafik
- **📸 Fiş OCR → otomatik gider** — Fişi fotoğrafla, AI tarih/tutar/KDV/kategori doldurur (~6sn)
- **📝 Ürün açıklaması yazımı** — Başlık + öneriler → SEO copy (Gemini streaming, ~8sn)
- **🎨 Ürün görseli üretimi** — Prompt → AI ile foto üretimi
- **✉️ Kampanya yazımı** — Segment + ton → kişiselleştirilmiş e-posta
- **👥 Müşteri segmentasyonu** — VIP / sadık / risky etiketleme + güven skoru + Türkçe gerekçe
- **⭐ Yorum sentiment & flag** — Negatif → otomatik özür + iade workflow

---

## 🔎 Veritabanıyla Konuş — Doğal dilden grafik

Asistan PostgreSQL'e **read-only kullanıcı** ile doğrudan SQL atar — `Order`, `Customer`, `Product`, `Inventory`, `Invoice`, `Review`, `BankTransaction`, `Refund` tablolarına erişir. Türkçe cevap + **grafik render** eder.

![Veritabanıyla Türkçe konuş akışı](web/public/team/diagrams/04-db-chat-sequence.png)

Aşağıdaki ekran görüntüleri **commerceos.cloud/admin/ai** üzerinde canlı çalıştırılmış sorguların kayıtlarıdır — kullanıcının yazdığı soru, AI'ın tool çağrıları (`query_database`, `render_chart`), tam Türkçe yanıt metni ve grafik tek karede.

### 🧪 Demo sorgu #1 — Bu hafta en çok satan ürünler (bar chart)

> _"Bu hafta en çok satan 3 ürünü grafik olarak gelirlerini göster"_

AI Postgres'e `OrderItem ⋈ Product ⋈ Order` SQL'i atar, son 7 günlük satışları ciroya göre sıralar, sonucu Türkçe özetler ve bar chart üretir.

![Bu hafta en çok satan ürünler — canlı admin paneli kaydı](web/public/team/diagrams/demo-top-products.png)

---

### 🧪 Demo sorgu #2 — Aylık ciro trendi (line chart)

> _"Son 5 ayın ciro trendini ver"_

AI ay bazında ciro toplamı çıkarır, line chart ile zaman serisini renderlar, Türkçe yorumla zirve ayını işaret eder.

![Son 5 ayın ciro trendi — canlı admin paneli kaydı](web/public/team/diagrams/demo-revenue-trend.png)

---

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

> Hem **light** hem **dark** tema mevcut — kullanıcı admin sidebar'ından geçiş yapar. Aşağıda ikisi de karışık.

<table>
<tr>
<td width="50%">

**Yönetici dashboard (dark)**

![Dashboard](https://commerceos.cloud/team/shot-dashboard-dark.jpg)

</td>
<td width="50%">

**AI Geliştirici görev listesi (light)**

![Agent](https://commerceos.cloud/team/shot-agent-dark.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Otopilot — 7 paralel iş (dark)**

![Autopilot](https://commerceos.cloud/team/shot-autopilot-dark.jpg)

</td>
<td width="50%">

**Banka hareketleri · AI eşleştirme (light)**

![Bank](https://commerceos.cloud/team/shot-bank-dark.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Finans + nakit akışı tahmini (light)**

![Finance](https://commerceos.cloud/team/shot-finance-dark.jpg)

</td>
<td width="50%">

**Analitik trendler (light)**

![Analytics](https://commerceos.cloud/team/shot-analytics-light.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Sipariş yönetimi (light)**

![Orders](https://commerceos.cloud/team/shot-orders-light.jpg)

</td>
<td width="50%">

**Ürün yönetimi (light)**

![Products](https://commerceos.cloud/team/shot-products-light.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Müşteri segmentasyonu (light)**

![Customers](https://commerceos.cloud/team/shot-customers.jpg)

</td>
<td width="50%">

**KVKK veri silme talepleri (light)**

![Data Requests](https://commerceos.cloud/team/shot-data-requests.jpg)

</td>
</tr>
<tr>
<td width="50%">

**Yorumlar · AI sentiment**

![Reviews](https://commerceos.cloud/team/shot-reviews.jpg)

</td>
<td width="50%">

**Gelecek ödemeler · scheduled payments**

![Scheduled](https://commerceos.cloud/team/shot-scheduled.jpg)

</td>
</tr>
</table>

### 🛒 Shop (Pamuk markası)

<table>
<tr>
<td width="50%">

**Mağaza ana sayfa — hero + öne çıkanlar**

![Shop Home](https://commerceos.cloud/team/shot-shop-home.jpg)

</td>
<td width="50%">

**Kategori sayfası — filtreler + sıralama**

![Shop Category](https://commerceos.cloud/team/shot-shop-category.jpg)

</td>
</tr>
<tr>
<td colspan="2">

**Ürün detay — beden seçimi, sepete ekle, ilgili ürünler**

![Shop Product](https://commerceos.cloud/team/shot-shop-product.jpg)

</td>
</tr>
</table>

---

## 🇹🇷 Türkiye altyapısı

| Entegrasyon | Açıklama |
|---|---|
| **KVKK** | Veri silme talepleri akışı (`/shop/account/settings` → admin onayı), çerez yönetimi, AI ile gizlilik metni üretimi |
| **GİB** | E-fatura / e-arşiv UBL-TR 1.2 XML, otopilot otomatik gönderim |
| **iyzico** | 3DS Checkout Form sandbox + production, HMAC-signed callback handler |
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
- Gemini 2.5 Pro (tüm AI özellikleri + agent loop)
- Tool-use motoru (agent loop · worktree + TSC gate)

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

![CommerceOS mimari](web/public/team/diagrams/05-architecture.png)

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
