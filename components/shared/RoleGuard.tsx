"use client";

/**
 * RoleGuard — ให้เข้าหน้าได้เฉพาะคนที่มี Role ตรงกัน
 * ผู้ดูแล: ทิวากร
 *
 * ตัวอย่าง (ใส่ใน layout.tsx ของแต่ละ Role):
 *   <RoleGuard role="admin">...</RoleGuard>
 *
 * ยังไม่ล็อกอิน    → ไปหน้า /login
 * ล็อกอินคนละ Role → ไปหน้าแรกของ Role ตัวเอง
 */

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getCurrentUser, ROLE_HOME, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();

  // ทำงานตอนเปิดหน้า และทุกครั้งที่ user เปลี่ยน เช่น กดออกจากระบบ
  useEffect(() => {
    // ต้องอ่านจาก getCurrentUser() ไม่ใช่ user ด้านบน
    // เพราะตอนเปิดหน้าครั้งแรก user จะเป็น null ชั่วขณะ แม้ล็อกอินอยู่ (server ไม่มี localStorage)
    // ถ้าเชื่อค่านั้น กด refresh ทีไรจะโดนเด้งไปหน้า login
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.replace("/login");
    } else if (currentUser.role !== role) {
      router.replace(ROLE_HOME[currentUser.role]);
    }
  }, [user, role, router]);

  if (user?.role !== role) {
    return <p className="p-10 text-center text-sm text-slate-500">กำลังตรวจสอบสิทธิ์...</p>;
  }

  return children;
}
