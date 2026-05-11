import {
  Activity,
  BarChart3,
  Boxes,
  Building,
  Building2,
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  Package,
  Percent,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "finance" | "ai" | "system";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/admin/products", label: "Ürünler", icon: Package, group: "main" },
  { href: "/admin/categories", label: "Kategoriler", icon: FolderTree, group: "main" },
  { href: "/admin/inventory", label: "Envanter", icon: Boxes, group: "main" },
  { href: "/admin/orders", label: "Siparişler", icon: ShoppingCart, group: "main" },
  { href: "/admin/customers", label: "Müşteriler", icon: Users, group: "main" },
  { href: "/admin/reviews", label: "Yorumlar", icon: Star, group: "main" },
  { href: "/admin/discounts", label: "İndirimler", icon: Percent, group: "main" },
  { href: "/admin/analytics", label: "Analitik", icon: BarChart3, group: "main" },

  { href: "/admin/finance", label: "Finans", icon: TrendingUp, group: "finance" },
  { href: "/admin/expenses", label: "Giderler", icon: Wallet, group: "finance" },
  { href: "/admin/invoices", label: "E-Fatura", icon: Receipt, group: "finance" },
  { href: "/admin/bank", label: "Banka", icon: Building, group: "finance" },
  { href: "/admin/suppliers", label: "Tedarikçiler", icon: Building2, group: "finance" },

  { href: "/admin/ai", label: "AI Asistan", icon: MessageSquare, group: "ai" },
  { href: "/admin/autopilot", label: "Otopilot", icon: Sparkles, group: "ai" },
  { href: "/admin/activity", label: "Etkinlik", icon: Activity, group: "system" },
  { href: "/admin/data-requests", label: "KVKK", icon: Shield, group: "system" },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings, group: "system" },
];
