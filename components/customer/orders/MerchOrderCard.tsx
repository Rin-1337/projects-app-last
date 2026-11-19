import { formatEventDate } from "@/components/customer/common/formatEventDate";
import { getSizeLabel } from "@/components/customer/shop/getCartRows";
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
const SHIPPING_BADGE: Record<ShippingStatus, string> = {
  pending: "bg-[#FFF1C7] text-[#7A5200]",
  preparing: "bg-white text-base-content",
  shipped: "bg-[#E3EEFB] text-[#1D5FA8]",
  delivered: "bg-[#DCF5E7] text-[#0B6B44]",
  cancelled: "bg-white text-base-content/60",
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
    <div className="flex flex-col gap-3.5 rounded-3xl bg-base-200 p-6">
      {/* ───── หัวการ์ด: ชื่องาน + สถานะ ───── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xl tracking-[-0.01em]">{eventTitle}</p>
          <p className="text-[13px] text-base-content/60">
            เลขที่ {order.id} · {formatEventDate(order.createdAt)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[13px] leading-none ${SHIPPING_BADGE[shippingStatus]}`}>{SHIPPING_LABEL[shippingStatus]}</span>
      </div>

      {/* ───── รายการสินค้า ───── */}
      <ul className="flex flex-col gap-1.5">
        {order.items.map((item) => (
          <li key={item.productId + item.size} className="flex justify-between gap-3 text-[15px]">
            <div>
              <p>{getProductName(item.productId)}</p>
              <p className="text-base-content/60">
                {getSizeLabel(item.size)} · {item.unitPrice.toLocaleString()} × {item.quantity}
              </p>
            </div>
            <span>{(item.unitPrice * item.quantity).toLocaleString()} บาท</span>
          </li>
        ))}
      </ul>

      {/* ───── ยอดรวม ───── */}
      <div className="flex items-baseline justify-between border-t border-[#E5E5E5] pt-3">
        <span className="text-sm text-base-content/60">ยอดรวม</span>
        <span className="text-[26px] tracking-[-0.02em]">{order.total.toLocaleString()} บาท</span>
      </div>

      {/* ───── ข้อมูลจัดส่ง ───── */}
      {order.trackingNo && (
        <p className="text-sm">
          เลขพัสดุ: <span className="font-mono">{order.trackingNo}</span>
        </p>
      )}
      {order.shippingAddress && (
        <p className="text-sm whitespace-pre-line text-base-content/60">ที่อยู่จัดส่ง: {order.shippingAddress}</p>
      )}

      {/* ───── ปุ่มชำระเงิน (เฉพาะที่ยังไม่จ่าย) ───── */}
      {isWaitingPayment && (
        <button type="button" onClick={onPay} className="btn btn-primary btn-block text-[15px] font-normal">
          ชำระเงิน
        </button>
      )}
    </div>
  );
}
