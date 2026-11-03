"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

export function NavLinks({ nav, active }: { nav: NavItem[]; active?: string }) {
  return (
    <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
            active === item.href
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** เมนูที่ไฮไลต์หน้าปัจจุบัน (เลือก href ที่ตรงกับ path ยาวที่สุด) */
export function RoleNav({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const active = nav
    .filter((n) => pathname === n.href || pathname.startsWith(n.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return <NavLinks nav={nav} active={active} />;
}
