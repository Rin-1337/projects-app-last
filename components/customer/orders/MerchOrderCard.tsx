import { formatEventDate } from "@/components/customer/common/formatEventDate";
import { getSizeLabel } from "@/components/customer/shop/getCartRows";
import { Badge, Button, Card } from "@/components/ui";
import type { MerchOrder, MerchProduct, ShippingStatus } from "@/lib/types";

/** ข้อความภาษาไทยของสถานะการจัดส่ง */
const SHIPPING_LABEL: Record<ShippingStatus, string> = {
  pending: "รอชำระเงิน",
  preparing: "กำลังเตรียมสินค้า",
  shipped: "จัดส่งแล้ว",
  delivered: "ได้รับสินค้าแล้ว",
  cancelled: "ยกเลิก",
};

/** สีป้ายของสถานะการจัดส่ง */
const SHIPPING_TONE: Record<ShippingStatus, "gray" | "blue" | "green" | "yellow" | "red"> = {
  pending: "yellow",
  preparing: "blue",
  shipped: "blue",
  delivered: "green",
  cancelled: "gray",
};

/**
 * การ์ดคำสั่งซื้อเสื้อ/ของที่ระลึก 1 รายการ ใช้ในหน้าประวัติคำสั่งซื้อ
 * แสดง: ชื่องาน, วันที่สั่ง, รายการสินค้า, ยอดรวม, สถานะจัดส่ง, เลขพัสดุ, ที่อยู่
 * ถ้ายังไม่จ่ายเงิน จะมีปุ่ม "ชำระเงิน" ให้กดจ่ายต่อได้
 */
export function MerchOrderCard({
  order,
  eventTitle,
  products,
  onPay,
}: {
  order: MerchOrder;
  eventTitle: string;
  products: MerchProduct[];
  onPay: () => void;
}) {
  // คำสั่งซื้อเก่าอาจไม่มี shippingStatus ให้ถือว่า "รอชำระเงิน"
  let shippingStatus: ShippingStatus = "pending";
  if (order.shippingStatus) {
    shippingStatus = order.shippingStatus;
  }

  // ยังไม่จ่าย = แสดงปุ่มชำระเงิน
  const isWaitingPayment = order.paymentStatus === "pending";

  /** หาชื่อสินค้าจาก id (ถ้าสินค้าถูกลบไปแล้วจะแสดง "สินค้า") */
  function getProductName(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (product) {
      return product.name;
    }
    return "สินค้า";
  }

  return (
    <Card className="space-y-3">
      {/* ───── หัวการ์ด: ชื่องาน + สถานะ ───── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{eventTitle}</p>
          <p className="text-sm text-slate-500">
            เลขที่ {order.id} · {formatEventDate(order.createdAt)}
          </p>
        </div>
        <Badge tone={SHIPPING_TONE[shippingStatus]}>{SHIPPING_LABEL[shippingStatus]}</Badge>
      </div>

      {/* ───── รายการสินค้า ───── */}
      <ul className="divide-y divide-slate-100 border-y border-slate-100">
        {order.items.map((item) => (
          <li key={item.productId + item.size} className="flex justify-between gap-3 py-2 text-sm">
            <div>
              <p className="text-slate-900">{getProductName(item.productId)}</p>
              <p className="text-slate-500">
                {getSizeLabel(item.size)} · {item.unitPrice.toLocaleString()} × {item.quantity}
              </p>
            </div>
            <span className="text-slate-900">
              {(item.unitPrice * item.quantity).toLocaleString()} บาท
            </span>
          </li>
        ))}
      </ul>

      {/* ───── ยอดรวม ───── */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">ยอดรวม</span>
        <span className="text-lg font-bold text-slate-900">{order.total.toLocaleString()} บาท</span>
      </div>

      {/* ───── ข้อมูลจัดส่ง ───── */}
      {order.trackingNo && (
        <p className="text-sm text-slate-700">
          เลขพัสดุ: <span className="font-mono font-semibold">{order.trackingNo}</span>
        </p>
      )}
      {order.shippingAddress && (
        <p className="whitespace-pre-line text-sm text-slate-500">
          ที่อยู่จัดส่ง: {order.shippingAddress}
        </p>
      )}

      {/* ───── ปุ่มชำระเงิน (เฉพาะที่ยังไม่จ่าย) ───── */}
      {isWaitingPayment && (
        <Button onClick={onPay} className="w-full">
          ชำระเงิน
        </Button>
      )}
    </Card>
  );
}
