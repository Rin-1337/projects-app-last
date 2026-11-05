/**
 * โครงหน้าของแต่ละ Role: แถบบน + เมนู
 * ผู้ดูแล: นัฐวิ (PM)
 * การเช็ก role อยู่ใน RoleGuard ซึ่งครอบ RoleShell ใน layout.tsx ของแต่ละ Role
 */

import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { NavLinks, RoleNav, type NavItem } from "./RoleNav";
import { UserMenu } from "./UserMenu";

export type { NavItem };

export function RoleShell({
  roleLabel,
  nav,
  children,
}: {
  roleLabel: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold text-slate-900">
            Event Platform
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{roleLabel}</span>
            <UserMenu />
          </div>
        </div>
        {/* usePathname ต้องอยู่ใน Suspense เพราะโปรเจคเปิด cacheComponents */}
        <Suspense fallback={<NavLinks nav={nav} />}>
          <RoleNav nav={nav} />
        </Suspense>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
