import { CartProvider } from "@/components/customer/CartContext";
import { CUSTOMER_NAV } from "@/components/customer/nav";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { RoleShell } from "@/components/shared/RoleShell";

// ผู้รับผิดชอบ: ทิวากร
export const instant = false;

export default function CustomerLayout({ children }: LayoutProps<"/customer">) {
  return (
    <RoleGuard role="customer">
      <RoleShell roleLabel="ผู้เข้าร่วมงาน" nav={CUSTOMER_NAV}>
        {/* ครอบตะกร้าไว้ที่ layout เพื่อให้ตะกร้ายังอยู่ตอนเปลี่ยนหน้า shop → cart → checkout */}
        <CartProvider>{children}</CartProvider>
      </RoleShell>
    </RoleGuard>
  );
}
