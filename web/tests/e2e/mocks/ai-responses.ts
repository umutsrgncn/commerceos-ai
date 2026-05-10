/**
 * AI servisinin (FastAPI ai-service) ve Next.js /api/ai/* proxy'lerinin
 * deterministik mock yanıtları. Test'lerde Gemini quota yememek + flake
 * önlemek için kullanılır.
 *
 * E2E_REAL_AI=1 env ile mock devre dışı, gerçek AI çağrısı yapılır.
 */

export const AI_MOCKS = {
  // POST /finance/expense/categorize
  expenseCategorize: {
    category: "MARKETING",
    confidence: 92,
    reasoning: "Reklam ve dijital pazarlama göstergesi.",
  },

  // POST /finance/discount/suggest
  discountSuggest: {
    code: "E2EOFFER25",
    description: "Test kampanyası — yaz indirim",
    type: "PERCENTAGE" as const,
    value: 15,
    minSubtotalMinor: 50000,
    days: 14,
    reasoning: "Yaz dönemi orta sepet için %15 yeterli.",
    confidence: 88,
  },

  // POST /finance/cashflow/forecast
  cashflowForecast: {
    starting_balance_minor: 1500000,
    daily: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        in_minor: 80000 + i * 1000,
        out_minor: 50000,
        balance_minor: 1500000 + (80000 + i * 1000 - 50000) * (i + 1),
      };
    }),
    warnings: [
      {
        date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        severity: "medium",
        message: "Kira günü yaklaşıyor, bakiye sınırda.",
      },
    ],
    summary: "30 gün boyunca pozitif bakiye. Risk: kira günü.",
    history_days_used: 90,
    pending_orders_count: 3,
  },

  // POST /finance/anomaly/scan
  anomalyScan: {
    anomalies: [
      {
        metric: "expense_MARKETING",
        severity: "high",
        title: "MARKETING %180 arttı",
        explanation: "Geçen 4 hafta ortalaması 5K, bu hafta 14K.",
        action: "Reklam bütçesini gözden geçir.",
        current: "14000 TL",
        baseline: "5000 TL",
        change_pct: 180,
      },
    ],
    summary: "Reklam giderinde belirgin artış.",
    candidates_evaluated: 3,
  },

  // POST /pricing/suggest
  pricingSuggest: {
    ok: true,
    product_id: "PLACEHOLDER",
    product_name: "PLACEHOLDER",
    current_price_minor: 10000,
    cost_price_minor: 5000,
    suggested_price_minor: 11500,
    suggested_margin_pct: 56.5,
    current_margin_pct: 50,
    expected_sales_change_pct: -5,
    expected_profit_change_pct: 12,
    confidence: 78,
    reasoning: "Mevcut marj iyi, satış hızı yüksek; %15 fiyat artırıştan kâr +%12 beklenir.",
    action: "increase",
    sales_30d: 24,
    revenue_30d_minor: 240000,
  },

  // POST /receipt/ocr
  receiptOcr: {
    ok: true,
    amount_minor: 12450,
    currency: "TRY",
    vendor: "Test Tedarikçi A.Ş.",
    date: "2026-05-09",
    description: "E2E test fişinden çıkarılan gider",
    category_guess: "SUPPLIES",
    confidence: 91,
    notes: null,
  },

  // POST /reviews/reply
  reviewsReply: {
    text:
      "Yorumunuz için çok teşekkür ederiz! Ürünümüzden memnun kaldığınızı duymak çok güzel.",
    confidence: 92,
  },

  // POST /reviews/analyze
  reviewsAnalyze: {
    summary: "Genel olarak müşteriler memnun, kargo hızlı bulunuyor.",
    sentiment: { positive: 80, neutral: 15, negative: 5 },
    themes: ["kargo hızı", "fiyat-performans", "kalite"],
    actions: ["Olumsuz yorumların 1-2 günde cevaplanması"],
  },

  // POST /bank/match
  bankMatch: {
    matched_order_id: "PLACEHOLDER",
    matched_order_number: "PLACEHOLDER",
    confidence: 92,
    reasoning: "Açıklamada sipariş no geçiyor ve tutar tam eşleşiyor.",
    candidate_count: 1,
  },

  // POST /messages/draft
  messagesDraft: {
    text: "Merhaba, siparişiniz kargoya verildi. İyi günler dileriz.",
  },

  // POST /messages/supplier-reorder
  supplierReorder: {
    subject: "Sipariş: Test Ürün - 50 adet",
    body:
      "Merhaba,\n\nStoğumuz kritik seviyeye düştü. 50 adet sipariş geçmek istiyoruz.\n\nLead time teyit eder misiniz?\n\nİyi çalışmalar.",
  },

  // POST /products/describe
  productDescribe: {
    description:
      "E2E test için üretilmiş kısa açıklama. Premium kalite, hızlı kargo.",
  },

  // POST /chat/agent/stream — multi-line NDJSON, basit text-only mock
  agentStream:
    `{"type":"delta","text":"Bu bir test cevabıdır. "}\n` +
    `{"type":"delta","text":"AI şu an mock modda."}\n` +
    `{"type":"done"}\n`,

  // POST /chat/stream
  chatStream:
    `{"type":"delta","text":"Mock chat cevabı."}\n` +
    `{"type":"done"}\n`,

  // POST /finance/insight/stream
  financeInsightStream: "Mock finansal içgörü cevabı, AI mock modda.",

  // POST /customers/segment
  customerSegment: {
    segment: "Sadık müşteri",
    confidence: 85,
    reasoning: "Birden fazla sipariş geçmişi.",
    actions: ["Loyalty programına davet", "Özel indirim teklifi"],
  },

  // POST /goals/suggest
  goalSuggest: {
    suggestedAmountMinor: 5000000,
    confidence: 80,
    reasoning: "Geçen ay %20 artış öngörülüyor.",
  },
};
