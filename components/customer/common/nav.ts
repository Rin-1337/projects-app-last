import type { NavItem } from "@/components/shared/RoleNav";

/** เมนูของลูกค้า ใช้ร่วมกันระหว่างหน้าแรก (app/page.tsx) และ app/customer/layout.tsx */
export const CUSTOMER_NAV: NavItem[] = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/customer/events", label: "รายการ Event" },
  { href: "/customer/tickets", label: "บัตรของฉัน" },
  { href: "/customer/wallet", label: "Token Wallet" },
  { href: "/customer/shop", label: "เสื้อและของที่ระลึก" },
  { href: "/customer/orders", label: "ประวัติรายการ" },
  { href: "/customer/profile", label: "โปรไฟล์" },
];
