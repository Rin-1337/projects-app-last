"use client";

import { PasswordForm } from "@/components/customer/profile/PasswordForm";
import { ProfileForm } from "@/components/customer/profile/ProfileForm";
import { useAuth } from "@/lib/auth";
import { PAGE_TITLE } from "@/components/customer/common/styles";

// หน้าโปรไฟล์ — ผู้รับผิดชอบ: ทิวากร
//   ซ้าย: แก้ชื่อ / เบอร์โทร (ProfileForm)
//   ขวา: เปลี่ยนรหัสผ่าน (PasswordForm)
// ปุ่มออกจากระบบอยู่ใน CustomerShell มุมบนขวาอยู่แล้ว หน้านี้จึงไม่ต้องมี

export default function CustomerProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null; // RoleGuard ใน layout รับประกันว่าล็อกอินแล้ว
  }

  return (
    <div className="mx-auto max-w-275 space-y-12 px-5 pt-6 pb-24 sm:px-10">
      <h1 className={PAGE_TITLE}>โปรไฟล์.</h1>

      {/* ชื่อ + รหัสสมาชิก */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="avatar avatar-placeholder">
          <div className="w-22 rounded-full bg-neutral text-neutral-content">
            <span className="text-4xl">{user.name.charAt(0)}</span>
          </div>
        </div>
        <div>
          <p className="text-[28px] tracking-[-0.02em]">{user.name}</p>
          <p className="text-[15px] text-base-content/60">
            ผู้เข้าร่วมงาน{user.customerCode && ` · รหัสสมาชิก ${user.customerCode}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-5">
        <ProfileForm user={user} />
        <PasswordForm userId={user.id} />
      </div>
    </div>
  );
}
