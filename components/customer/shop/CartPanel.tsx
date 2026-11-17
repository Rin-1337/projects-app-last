import Link from "next/link";
import { Button, Card, CardTitle } from "@/components/ui";
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
    <Card>
      <CardTitle>ตะกร้าสินค้า ({totalQuantity} ชิ้น)</CardTitle>

      {rows.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีสินค้าในตะกร้า</p>}

      {rows.length > 0 && (
        <>
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.productId + row.size} className="space-y-2 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {getSizeLabel(row.size)} · {row.unitPrice.toLocaleString()} บาท/ชิ้น
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(row.productId, row.size)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    ลบ
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onChangeQuantity(row.productId, row.size, -1)}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{row.quantity}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onChangeQuantity(row.productId, row.size, 1)}
                      disabled={row.quantity >= row.stock}
                    >
                      +
                    </Button>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {row.lineTotal.toLocaleString()} บาท
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm text-slate-600">ราคารวม</span>
            <span className="text-xl font-bold text-slate-900">
              {totalPrice.toLocaleString()} บาท
            </span>
          </div>

          <Link
            href="/customer/shop/checkout"
            className="mt-4 block rounded-lg bg-blue-600 px-5 py-2.5 text-center font-medium text-white hover:bg-blue-700"
          >
            สั่งซื้อ
          </Link>
        </>
      )}
    </Card>
  );
}
