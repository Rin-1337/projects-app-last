import Link from "next/link";
import { Card, CardTitle } from "@/components/ui";
import { getSizeLabel, getTotalPrice, type CartRow } from "@/components/customer/shop/getCartRows";

/**
 * สรุปรายการสินค้าในหน้าสั่งซื้อ (ดูได้อย่างเดียว)
 * ถ้าจะแก้จำนวน ให้กดลิงก์กลับไปแก้ที่ตะกร้าในหน้าร้าน
 */
export function OrderSummary({ eventTitle, rows }: { eventTitle: string; rows: CartRow[] }) {
  const totalPrice = getTotalPrice(rows);

  return (
    <Card>
      <CardTitle>สรุปรายการ</CardTitle>
      <p className="-mt-2 mb-3 text-sm text-slate-500">{eventTitle}</p>

      <ul className="divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.productId + row.size} className="flex justify-between gap-3 py-2 text-sm">
            <div>
              <p className="font-medium text-slate-900">{row.name}</p>
              <p className="text-slate-500">
                {getSizeLabel(row.size)} · {row.unitPrice.toLocaleString()} × {row.quantity}
              </p>
            </div>
            <span className="font-semibold text-slate-900">
              {row.lineTotal.toLocaleString()} บาท
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm text-slate-600">ยอดที่ต้องชำระ</span>
        <span className="text-xl font-bold text-slate-900">{totalPrice.toLocaleString()} บาท</span>
      </div>

      <Link href="/customer/shop" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
        ← กลับไปแก้ไขตะกร้า
      </Link>
    </Card>
  );
}
