import { RoleShell, type NavItem } from "@/components/shared/RoleShell";

// ผู้รับผิดชอบ: สุรัมภา
// TODO: ครอบด้วย RoleGuard ให้เข้าได้เฉพาะ role = "vendor" (รอ lib/auth.tsx จากทิวากร)

const nav: NavItem[] = [
  { href: "/vendor", label: "Dashboard" },
  { href: "/vendor/shop", label: "ข้อมูลร้าน" },
  { href: "/vendor/products", label: "สินค้า" },
  { href: "/vendor/receive", label: "QR รับชำระ" },
  { href: "/vendor/transactions", label: "ธุรกรรม" },
  { href: "/vendor/bank", label: "บัญชีธนาคาร" },
  { href: "/vendor/withdraw", label: "ถอนเงิน" },
];

export default function VendorLayout({ children }: LayoutProps<"/vendor">) {
  return (
    <RoleShell roleLabel="ร้านค้า" nav={nav}>
      {children}
    </RoleShell>
  );
}
