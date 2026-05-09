import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  Package,
  Percent,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "ai";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/admin/products", label: "Ürünler", icon: Package, group: "main" },
  { href: "/admin/categories", label: "Kategoriler", icon: FolderTree, group: "main" },
  { href: "/admin/inventory", label: "Envanter", icon: Boxes, group: "main" },
  { href: "/admin/orders", label: "Siparişler", icon: ShoppingCart, group: "main" },
  { href: "/admin/customers", label: "Müşteriler", icon: Users, group: "main" },
  { href: "/admin/discounts", label: "İndirimler", icon: Percent, group: "main" },
  { href: "/admin/analytics", label: "Analitik", icon: BarChart3, group: "main" },
  { href: "/admin/ai", label: "AI Asistan", icon: MessageSquare, group: "ai" },
];
