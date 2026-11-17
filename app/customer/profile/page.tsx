"use client";

import { PasswordForm } from "@/components/customer/profile/PasswordForm";
import { ProfileForm } from "@/components/customer/profile/ProfileForm";
import { useAuth } from "@/lib/auth";

// หน้าโปรไฟล์ — ผู้รับผิดชอบ: ทิวากร
//   ซ้าย: แก้ชื่อ / เบอร์โทร (ProfileForm)
//   ขวา: เปลี่ยนรหัสผ่าน (PasswordForm)
// ปุ่มออกจากระบบอยู่ใน UserMenu มุมบนอยู่แล้ว หน้านี้จึงไม่ต้องมี

export default function CustomerProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null; // RoleGuard ใน layout รับประกันว่าล็อกอินแล้ว
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">โปรไฟล์</h1>

      <div className="grid gap-5 md:grid-cols-2">
        <ProfileForm user={user} />
        <PasswordForm userId={user.id} />
      </div>
    </div>
  );
}
