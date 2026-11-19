import type { NavItem } from "@/components/shared/RoleNav";

/** เมนูของลูกค้า ใช้ร่วมกันระหว่างหน้าแรก (app/page.tsx) และ app/customer/layout.tsx */
export const CUSTOMER_NAV: NavItem[] = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/customer/events", label: "อีเวนต์" },
  { href: "/customer/tickets", label: "บัตรของฉัน" },
  { href: "/customer/wallet", label: "กระเป๋า Token" },
  { href: "/customer/shop", label: "ของที่ระลึก" },
  { href: "/customer/orders", label: "คำสั่งซื้อ" },
  { href: "/customer/profile", label: "บัญชี" },
];
