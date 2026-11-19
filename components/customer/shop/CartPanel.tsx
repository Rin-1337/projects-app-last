import Link from "next/link";
import { getSizeLabel, getTotalPrice, getTotalQuantity, type CartRow } from "./getCartRows";

/**
 * ตะกร้าสินค้าในหน้าร้าน
 * แต่ละแถว: ชื่อ / ไซซ์ / ปุ่ม − จำนวน + / ราคารวมของแถว / ปุ่มลบ
 * ด้านล่าง: จำนวนชิ้นทั้งหมด + ราคารวม + ปุ่ม "สั่งซื้อ" ไปหน้า checkout
 */
export function CartPanel({
  rows,
  onChangeQuantity,
  onRemove,
}: {
  rows: CartRow[];
  onChangeQuantity: (productId: string, size: string, change: number) => void;
  onRemove: (productId: string, size: string) => void;
}) {
  const totalQuantity = getTotalQuantity(rows);
  const totalPrice = getTotalPrice(rows);

  return (
    <div className="flex flex-col gap-3.5 rounded-3xl bg-base-200 p-6">
      <h2 className="text-2xl font-normal tracking-[-0.02em]">ตะกร้า · {totalQuantity} ชิ้น</h2>

      {rows.length === 0 && <p className="text-sm text-base-content/60">ยังไม่มีสินค้าในตะกร้า</p>}

      {rows.length > 0 && (
        <>
          <ul className="divide-y divide-[#E5E5E5]">
            {rows.map((row) => (
              <li key={row.productId + row.size} className="space-y-2 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px]">{row.name}</p>
                    <p className="text-[13px] text-base-content/60">
                      {getSizeLabel(row.size)} · {row.unitPrice.toLocaleString()} บาท/ชิ้น
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(row.productId, row.size)}
                    className="btn btn-ghost btn-xs text-error"
                  >
                    ลบ
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="ลดจำนวน"
                      className="btn btn-circle h-9 w-9 bg-base-100 font-normal"
                      onClick={() => onChangeQuantity(row.productId, row.size, -1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-[15px]">{row.quantity}</span>
                    <button
                      type="button"
                      aria-label="เพิ่มจำนวน"
                      className="btn btn-circle h-9 w-9 bg-base-100 font-normal"
                      onClick={() => onChangeQuantity(row.productId, row.size, 1)}
                      disabled={row.quantity >= row.stock}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[15px]">{row.lineTotal.toLocaleString()} บาท</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm text-base-content/60">ราคารวม</span>
            <span className="text-[32px] tracking-[-0.03em]">{totalPrice.toLocaleString()} บาท</span>
          </div>

          <Link href="/customer/shop/checkout" className="btn btn-primary h-13 text-[15px] font-normal">
            สั่งซื้อ
          </Link>
        </>
      )}
    </div>
  );
}
