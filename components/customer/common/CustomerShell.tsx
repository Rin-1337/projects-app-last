"use client";

import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import type { NavItem } from "@/components/shared/RoleNav";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { isDarkPage } from "./styles";
import { useIsClient } from "./useIsClient";

/**
 * โครงหน้าของฝั่งลูกค้า (หน้าตาแบบ Posh ด้วย daisyUI) — ผู้รับผิดชอบ: ทิวากร
 * ใช้แทน RoleShell เฉพาะฝั่งลูกค้า (Role อื่นยังใช้ RoleShell เหมือนเดิม)
 *
 *   ซ้าย: ชื่อเว็บ
 *   ขวา: เมนู + ปุ่มยอด Token (ยังไม่ล็อกอิน: ปุ่มเข้าสู่ระบบ / สมัครสมาชิก)
 *   หน้าพื้นดำ (รายชื่ออยู่ใน styles.ts) → ทั้ง header และเนื้อหาใช้ theme posh-dark
 *   แต่ละหน้าจึงไม่ต้องใส่ data-theme เอง
 */

// ฟอนต์ตามแบบ: Inter (อังกฤษ) + IBM Plex Sans Thai (ไทย) ใช้เฉพาะฝั่งลูกค้า
const inter = Inter({ subsets: ["latin"], display: "swap" });
const plexThai = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], display: "swap" });
const FONT_FAMILY = `${inter.style.fontFamily}, ${plexThai.style.fontFamily}, system-ui, sans-serif`;

export function CustomerShell({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col" style={{ fontFamily: FONT_FAMILY }}>
      {/* usePathname ต้องอยู่ใน Suspense เพราะโปรเจคเปิด cacheComponents */}
      <Suspense fallback={<Frame nav={nav} pathname="">{children}</Frame>}>
        <FrameWithPath nav={nav}>{children}</FrameWithPath>
      </Suspense>
    </div>
  );
}

function FrameWithPath({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <Frame nav={nav} pathname={pathname}>
      {children}
    </Frame>
  );
}

/** กรอบทั้งหน้า: เลือกพื้นขาว/พื้นดำตาม path แล้ววาง header + เนื้อหา */
function Frame({ nav, pathname, children }: { nav: NavItem[]; pathname: string; children: ReactNode }) {
  return (
    <div data-theme={isDarkPage(pathname) ? "posh-dark" : "posh"} className="flex-1 bg-base-100 text-base-content">
      <Header nav={nav} pathname={pathname} />
      {/* ไม่ครอบความกว้างตรงนี้ ให้แต่ละหน้าจัดเอง */}
      <main>{children}</main>
    </div>
  );
}

/**
 * หาเมนูของหน้าปัจจุบัน (เหมือน RoleNav)
 * เลือก href ที่ยาวที่สุดที่ตรงกับ path เช่นอยู่หน้า /customer/shop/checkout
 * ทั้ง "/customer/shop" และ "/customer" ตรง → เลือก "/customer/shop" เพราะยาวกว่า
 */
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
  // เมนูบนมือถือเปิดอยู่หรือไม่ (PC ไม่ใช้)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="px-5 py-5 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <Link href="/" className="text-[19px] font-semibold tracking-[-0.03em]">
          eventhub
        </Link>

        {/* จอ PC (md ขึ้นไป): เมนู + บัญชี แบบเดิม — บนมือถือซ่อนไว้ */}
        <div className="hidden flex-wrap items-center gap-6 md:flex">
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

        {/* มือถือ: ปุ่ม ☰ — บน PC ซ่อนไว้ */}
        <button
          type="button"
          aria-label={isMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="btn btn-ghost btn-square md:hidden"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {isMenuOpen && <MobileMenu nav={nav} activeHref={activeHref} onClose={() => setIsMenuOpen(false)} />}
    </header>
  );
}

/** เมนูบนมือถือ: แสดงเมื่อกดปุ่ม ☰ กดลิงก์ไหนแล้วปิดเมนูเอง */
function MobileMenu({ nav, activeHref, onClose }: { nav: NavItem[]; activeHref: string; onClose: () => void }) {
  return (
    <div className="mt-4 border-t border-base-300 pt-3 md:hidden">
      <nav aria-label="เมนูหลัก (มือถือ)" className="flex flex-col">
        {nav.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "rounded-lg bg-base-200 px-3 py-3 font-medium" : "rounded-lg px-3 py-3 text-base-content/70"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-3 border-t border-base-300 pt-4">
        <MobileAccount onClose={onClose} />
      </div>
    </div>
  );
}

/** ส่วนบัญชีในเมนูมือถือ (logic เดียวกับ HeaderAccount แต่ปุ่มเต็มความกว้าง) */
function MobileAccount({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const wallets = useStore("wallets");
  const isClient = useIsClient();

  // ยังไม่รู้ว่าใครล็อกอินอยู่ ไม่แสดงอะไรไปก่อน
  if (!isClient) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-2">
        <Link href="/login" onClick={onClose} className="btn btn-neutral h-11 w-full font-normal">
          เข้าสู่ระบบ
        </Link>
        <Link href="/register" onClick={onClose} className="btn h-11 w-full bg-base-200 font-normal">
          สมัครสมาชิก
        </Link>
      </div>
    );
  }

  // ยังไม่เคยเติม Token = ยังไม่มีกระเป๋า = 0
  const balance = wallets.find((wallet) => wallet.userId === user.id)?.balance ?? 0;

  function handleLogout() {
    onClose();
    logout();
  }

  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/customer/wallet"
        onClick={onClose}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-base-200 px-4.5 text-sm"
      >
        <WalletIcon />
        {balance.toLocaleString()} Token
      </Link>
      <button type="button" onClick={handleLogout} className="btn btn-ghost h-11 w-full font-normal text-base-content/70">
        ออกจากระบบ
      </button>
    </div>
  );
}

/** ไอคอน ☰ (เปิดเมนู) — รูปจาก Tabler Icons */
function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l16 0" />
      <path d="M4 12l16 0" />
      <path d="M4 18l16 0" />
    </svg>
  );
}

/** ไอคอน ✕ (ปิดเมนู) — รูปจาก Tabler Icons */
function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
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
      <Link href="/customer/wallet" className="inline-flex h-11 items-center gap-1.5 rounded-full bg-base-200 px-4.5 text-sm">
        <WalletIcon />
        {balance.toLocaleString()} Token
      </Link>
      <button type="button" onClick={logout} className="text-sm text-base-content/70 hover:text-base-content">
        ออกจากระบบ
      </button>
    </div>
  );
}

/** ไอคอนกระเป๋าเงิน (เส้น สีตามตัวหนังสือ จึงเป็นสีขาวเองบนหน้าพื้นดำ) — รูปจาก Tabler Icons */
function WalletIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" />
      <path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" />
    </svg>
  );
}
