import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
    <ComingSoon
      title="สมัครสมาชิก (Customer)"
      owner="ปอ"
      todo={["ฟอร์มชื่อ / อีเมล / รหัสผ่าน / เบอร์โทร", "เช็กอีเมลซ้ำ", "เรียก registerCustomer() แล้วเข้าสู่ระบบอัตโนมัติ"]}
    />
    </main>
  );
}
