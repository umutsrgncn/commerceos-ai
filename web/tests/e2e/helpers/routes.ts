/**
 * Tüm test'lerde kullanılan URL sabitleri. Tek bir yerden değiştirilebilir.
 *
 * Convention: parametreli olanlar fonksiyon, sabit olanlar string.
 */

export const ROUTES = {
  // Public
  landing: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",

  // Admin shell
  dashboard: "/admin",
  profile: "/admin/profile",
  activity: "/admin/activity",

  // Catalog
  products: "/admin/products",
  newProduct: "/admin/products/new",
  productDetail: (id: string) => `/admin/products/${id}`,
  categories: "/admin/categories",
  categoryDetail: (id: string) => `/admin/categories/${id}`,
  inventory: "/admin/inventory",

  // Customers + Orders
  customers: "/admin/customers",
  newCustomer: "/admin/customers/new",
  customerDetail: (id: string) => `/admin/customers/${id}`,
  orders: "/admin/orders",
  newOrder: "/admin/orders/new",
  orderDetail: (id: string) => `/admin/orders/${id}`,
  orderReceipt: (id: string) => `/admin/orders/${id}/receipt`,

  // Reviews
  reviews: "/admin/reviews",

  // Discounts
  discounts: "/admin/discounts",
  newDiscount: "/admin/discounts/new",
  discountEdit: (id: string) => `/admin/discounts/${id}`,

  // Finance
  finance: "/admin/finance",
  expenses: "/admin/expenses",
  newExpense: "/admin/expenses/new",
  expenseDetail: (id: string) => `/admin/expenses/${id}`,
  invoices: "/admin/invoices",
  invoiceDetail: (id: string) => `/admin/invoices/${id}`,
  bank: "/admin/bank",
  bankImport: "/admin/bank/import",
  suppliers: "/admin/suppliers",
  newSupplier: "/admin/suppliers/new",
  supplierDetail: (id: string) => `/admin/suppliers/${id}`,

  // AI
  aiChat: "/admin/ai",
  autopilot: "/admin/autopilot",

  // Analytics
  analytics: "/admin/analytics",

  // Settings
  settings: "/admin/settings",
} as const;

/** API webhook + tools route'ları (programmatic POST için). */
export const API = {
  bankWebhook: "/api/webhooks/bank",
  cashflowForecast: "/api/ai/cashflow-forecast",
  anomalyScan: "/api/ai/anomaly-scan",
  financeInsight: "/api/ai/finance-insight",
} as const;
