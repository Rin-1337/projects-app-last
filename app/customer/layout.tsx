import { CUSTOMER_NAV } from "@/components/customer/common/nav";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { RoleShell } from "@/components/shared/RoleShell";

// ผู้รับผิดชอบ: ทิวากร
export const instant = false;

export default function CustomerLayout({ children }: LayoutProps<"/customer">) {
  return (
    <RoleGuard role="customer">
      <RoleShell roleLabel="ผู้เข้าร่วมงาน" nav={CUSTOMER_NAV}>
        {children}
      </RoleShell>
    </RoleGuard>
  );
}
