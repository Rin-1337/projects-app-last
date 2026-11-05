"use client";

import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";

/** ชื่อผู้ใช้ + ปุ่มออกจากระบบ (แสดงบนแถบด้านบนของ RoleShell) */
export function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-700">{user?.name}</span>
      <Button variant="secondary" size="sm" onClick={logout}>
        ออกจากระบบ
      </Button>
    </div>
  );
}
