import Link from "next/link";
import { getSizeLabel, getTotalPrice, type CartRow } from "@/components/customer/shop/getCartRows";

/**
 * สรุปรายการสินค้าในหน้าสั่งซื้อ (ดูได้อย่างเดียว)
 * ถ้าจะแก้จำนวน ให้กดลิงก์กลับไปแก้ที่ตะกร้าในหน้าร้าน
 */
export function OrderSummary({ eventTitle, rows }: { eventTitle: string; rows: CartRow[] }) {
  const totalPrice = getTotalPrice(rows);

  return (
    <div className="rounded-3xl bg-base-200 p-6">
      <h2 className="text-2xl font-normal tracking-[-0.02em]">สรุปรายการ</h2>
      <p className="mb-3 text-sm text-base-content/60">{eventTitle}</p>

      <ul className="divide-y divide-[#E5E5E5]">
        {rows.map((row) => (
          <li key={row.productId + row.size} className="flex justify-between gap-3 py-2 text-sm">
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="text-base-content/60">
                {getSizeLabel(row.size)} · {row.unitPrice.toLocaleString()} × {row.quantity}
              </p>
            </div>
            <span>{row.lineTotal.toLocaleString()} บาท</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-baseline justify-between pt-3">
        <span className="text-sm text-base-content/60">ยอดที่ต้องชำระ</span>
        <span className="text-[28px] tracking-[-0.03em]">{totalPrice.toLocaleString()} บาท</span>
      </div>

      <Link href="/customer/shop" className="mt-3 inline-block text-sm text-base-content/60 hover:text-base-content">
        ← กลับไปแก้ไขตะกร้า
      </Link>
    </div>
  );
}
