import { RoleGuard } from "@/components/shared/RoleGuard";
import { RoleShell, type NavItem } from "@/components/shared/RoleShell";

// ผู้รับผิดชอบ: สุรัมภา

const nav: NavItem[] = [
  { href: "/vendor", label: "Dashboard" },
  { href: "/vendor/shop", label: "ข้อมูลร้าน" },
  { href: "/vendor/receive", label: "ขาย / รับ Token" },
  { href: "/vendor/transactions", label: "ธุรกรรม" },
  { href: "/vendor/bank", label: "บัญชีธนาคาร" },
  { href: "/vendor/withdraw", label: "ถอนเงิน" },
];

export default function VendorLayout({ children }: LayoutProps<"/vendor">) {
  return (
    <RoleGuard role="vendor">
      <RoleShell roleLabel="ร้านค้า" nav={nav}>
        {children}
      </RoleShell>
    </RoleGuard>
  );
}
