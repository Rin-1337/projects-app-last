import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
    <ComingSoon
      title="เข้าสู่ระบบ"
      owner="ปอ"
      todo={["ฟอร์มอีเมล + รหัสผ่าน", "ปุ่มบัญชีทดลอง 4 Role (รหัส 1234)", "ปุ่มรีเซ็ตข้อมูลทดลอง (resetDemoData)", "login สำเร็จ → ไปหน้าตาม Role"]}
    />
    </main>
  );
}
