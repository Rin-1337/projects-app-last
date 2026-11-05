import { RoleGuard } from "@/components/shared/RoleGuard";
import { RoleShell, type NavItem } from "@/components/shared/RoleShell";

// ผู้รับผิดชอบ: วิริญา (เมนู merch: อรอนงค์)

const nav: NavItem[] = [
  { href: "/organizer", label: "Dashboard" },
  { href: "/organizer/events", label: "Event" },
  { href: "/organizer/attendees", label: "ผู้เข้าร่วม" },
  { href: "/organizer/checkin", label: "Check-in" },
  { href: "/organizer/vendors", label: "ยอดขายร้านค้า" },
  { href: "/organizer/merch", label: "เสื้อ/ของที่ระลึก" },
  { href: "/organizer/merch/products", label: "สินค้า" },
  { href: "/organizer/merch/orders", label: "คำสั่งซื้อ" },
  { href: "/organizer/merch/booth", label: "ขายหน้าบูท" },
  { href: "/organizer/reports", label: "รายงาน" },
];

export default function OrganizerLayout({ children }: LayoutProps<"/organizer">) {
  return (
    <RoleGuard role="organizer">
      <RoleShell roleLabel="ผู้จัดงาน" nav={nav}>
        {children}
      </RoleShell>
    </RoleGuard>
  );
}
