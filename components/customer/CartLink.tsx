"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

/** ปุ่มตะกร้าพร้อมตัวเลขจำนวนชิ้น — ผู้รับผิดชอบ: ทิวากร */
export function CartLink() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/customer/shop/cart"
      className="relative inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
    >
      🛒 ตะกร้า
      {totalQuantity > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}
