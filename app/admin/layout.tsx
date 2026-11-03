import { RoleShell, type NavItem } from "@/components/shared/RoleShell";

// ผู้รับผิดชอบ: นัฐวิ
// TODO: ครอบด้วย RoleGuard ให้เข้าได้เฉพาะ role = "admin" (รอ lib/auth.tsx จากทิวากร)

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "ผู้ใช้" },
  { href: "/admin/vendors", label: "อนุมัติร้านค้า" },
  { href: "/admin/events", label: "Event" },
  { href: "/admin/topup", label: "เติม Token" },
  { href: "/admin/transactions", label: "ธุรกรรม" },
  { href: "/admin/withdrawals", label: "คำขอถอน" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RoleShell roleLabel="ผู้ดูแลระบบ" nav={nav}>
      {children}
    </RoleShell>
  );
}
