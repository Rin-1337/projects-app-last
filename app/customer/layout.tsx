import { CustomerShell } from "@/components/customer/common/CustomerShell";
import { CUSTOMER_NAV } from "@/components/customer/common/nav";
import { RoleGuard } from "@/components/shared/RoleGuard";

// ผู้รับผิดชอบ: ทิวากร
// ฝั่งลูกค้าใช้ CustomerShell (หน้าตาแบบ Posh) แทน RoleShell — Role อื่นยังใช้ RoleShell เหมือนเดิม
export const instant = false;

export default function CustomerLayout({ children }: LayoutProps<"/customer">) {
  return (
    <RoleGuard role="customer">
      <CustomerShell nav={CUSTOMER_NAV}>{children}</CustomerShell>
    </RoleGuard>
  );
}
