import { RoleShell, type NavItem } from "@/components/shared/RoleShell";

// ผู้รับผิดชอบ: ทิวากร
// TODO: ครอบด้วย RoleGuard ให้เข้าได้เฉพาะ role = "customer" (รอ lib/auth.tsx จากทิวากร)

const nav: NavItem[] = [
  { href: "/customer", label: "หน้าหลัก" },
  { href: "/customer/events", label: "งาน" },
  { href: "/customer/tickets", label: "บัตรของฉัน" },
  { href: "/customer/wallet", label: "Token Wallet" },
  { href: "/customer/pay", label: "จ่ายร้านค้า" },
  { href: "/customer/shop", label: "เสื้อและของที่ระลึก" },
  { href: "/customer/orders", label: "คำสั่งซื้อ" },
  { href: "/customer/profile", label: "โปรไฟล์" },
];

export default function CustomerLayout({ children }: LayoutProps<"/customer">) {
  return (
    <RoleShell roleLabel="ผู้เข้าร่วมงาน" nav={nav}>
      {children}
    </RoleShell>
  );
}
