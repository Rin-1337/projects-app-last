"use client";

import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import type { NavItem } from "@/components/shared/RoleNav";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { useIsClient } from "./useIsClient";

/**
 * โครงหน้าของฝั่งลูกค้า (หน้าตาแบบ Posh ด้วย daisyUI) — ผู้รับผิดชอบ: ทิวากร
 * ใช้แทน RoleShell เฉพาะฝั่งลูกค้า (Role อื่นยังใช้ RoleShell เหมือนเดิม)
 *
 *   ซ้าย: ชื่อเว็บ
 *   ขวา: เมนู + ปุ่มยอด Token (ยังไม่ล็อกอิน: ปุ่มเข้าสู่ระบบ / สมัครสมาชิก)
 *   หน้ารายละเอียดงาน / บัตรของฉัน / Wallet เป็นพื้นดำ header จะเป็นสีดำตาม
 */

// ฟอนต์ตามแบบ: Inter (อังกฤษ) + IBM Plex Sans Thai (ไทย) ใช้เฉพาะฝั่งลูกค้า
const inter = Inter({ subsets: ["latin"], display: "swap" });
const plexThai = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], display: "swap" });
const FONT_FAMILY = `${inter.style.fontFamily}, ${plexThai.style.fontFamily}, system-ui, sans-serif`;

export function CustomerShell({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  return (
    <div className="flex-1 bg-base-100 text-base-content" style={{ fontFamily: FONT_FAMILY }}>
      {/* usePathname ต้องอยู่ใน Suspense เพราะโปรเจคเปิด cacheComponents */}
      <Suspense fallback={<Header nav={nav} pathname="" />}>
        <HeaderWithPath nav={nav} />
      </Suspense>

      {/* ไม่ครอบความกว้างตรงนี้ ให้แต่ละหน้าจัดเอง (หน้าพื้นดำต้องใช้พื้นเต็มจอ) */}
      <main>{children}</main>
    </div>
  );
}

/** หน้าที่เป็นพื้นดำ (theme posh-dark) */
function isDarkPage(pathname: string) {
  return (
    pathname.startsWith("/customer/events/") ||
    pathname.startsWith("/customer/tickets") ||
    pathname.startsWith("/customer/wallet")
  );
}

function HeaderWithPath({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  return <Header nav={nav} pathname={pathname} />;
}

/** หาเมนูของหน้าปัจจุบัน (เลือก href ที่ยาวที่สุดที่ตรงกับ path เหมือน RoleNav) */
function findActiveHref(nav: NavItem[], pathname: string) {
  let activeHref = "";
  for (const item of nav) {
    const isMatch = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
    if (isMatch && item.href.length > activeHref.length) {
      activeHref = item.href;
    }
  }
  return activeHref;
}

function Header({ nav, pathname }: { nav: NavItem[]; pathname: string }) {
  const activeHref = findActiveHref(nav, pathname);

  return (
    <header
      data-theme={isDarkPage(pathname) ? "posh-dark" : "posh"}
      className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 bg-base-100 px-5 py-5 text-base-content sm:px-10"
    >
      <Link href="/" className="text-[19px] font-semibold tracking-[-0.03em]">
        eventhub
      </Link>

      <div className="flex flex-wrap items-center gap-6">
        <nav aria-label="เมนูหลัก" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {nav.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "font-medium" : "text-base-content/70 hover:text-base-content"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <HeaderAccount />
      </div>
    </header>
  );
}

/** ส่วนขวาสุดของ header */
function HeaderAccount() {
  const { user, logout } = useAuth();
  const wallets = useStore("wallets");
  const isClient = useIsClient();

  // ยังไม่รู้ว่าใครล็อกอินอยู่ ไม่แสดงอะไรไปก่อน (กันปุ่มเข้าสู่ระบบแวบขึ้นมา)
  if (!isClient) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login" className="btn btn-neutral h-11 font-normal">
          เข้าสู่ระบบ
        </Link>
        <Link href="/register" className="btn h-11 bg-base-200 font-normal">
          สมัครสมาชิก
        </Link>
      </div>
    );
  }

  // ยังไม่เคยเติม Token = ยังไม่มีกระเป๋า = 0
  const balance = wallets.find((wallet) => wallet.userId === user.id)?.balance ?? 0;

  return (
    <div className="flex items-center gap-4">
      <Link href="/customer/wallet" className="inline-flex h-11 items-center rounded-full bg-base-200 px-4.5 text-sm">
        {balance.toLocaleString()} Token
      </Link>
      <button type="button" onClick={logout} className="text-sm text-base-content/70 hover:text-base-content">
        ออกจากระบบ
      </button>
    </div>
  );
}
