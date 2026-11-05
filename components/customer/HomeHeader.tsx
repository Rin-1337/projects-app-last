"use client";

import Link from "next/link";
import { NavLinks } from "@/components/shared/RoleNav";
import { UserMenu } from "@/components/shared/UserMenu";
import { useAuth } from "@/lib/auth";
import { CUSTOMER_NAV } from "./nav";
import { useIsClient } from "./useIsClient";

const PRIMARY_LINK =
  "rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700";
const SECONDARY_LINK =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50";

/** ปุ่มสำหรับคนที่ยังไม่ล็อกอิน */
function GuestButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className={PRIMARY_LINK}>
        เข้าสู่ระบบ
      </Link>
      <Link href="/register" className={SECONDARY_LINK}>
        สมัครสมาชิก
      </Link>
    </div>
  );
}

/** เลือกว่าจะแสดงปุ่มชุดไหน */
function HeaderButtons() {
  const { user } = useAuth();
  const isClient = useIsClient();

  // ยังไม่รู้ว่าใครล็อกอินอยู่ ไม่แสดงอะไรไปก่อน
  // ไม่อย่างนั้นคนที่ล็อกอินแล้วจะเห็นปุ่มเข้าสู่ระบบแวบหนึ่ง
  if (!isClient) {
    return null;
  }

  if (!user) {
    return <GuestButtons />;
  }

  return <UserMenu />;
}

/** แถบด้านบนของหน้าแรก: ชื่อเว็บ + ปุ่ม + เมนู */
export function HomeHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900">
          Event Platform
        </Link>
        <HeaderButtons />
      </div>

      <NavLinks nav={CUSTOMER_NAV} active="/" />
    </header>
  );
}
