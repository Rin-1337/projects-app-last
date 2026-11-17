/**
 * Timeline ติดตามพัสดุ — ผู้รับผิดชอบ: ทิวากร
 *
 *   ● รอชำระเงิน
 *   ● กำลังเตรียมสินค้า     ← ลูกค้าจ่ายเงินแล้ว (confirmOnlinePayment)
 *   ○ ส่งให้ขนส่งแล้ว       ← Organizer อัปเดต (updateShipping) + ใส่เลขพัสดุ
 *   ○ จัดส่งสำเร็จ
 */

import type { ShippingStatus } from "@/lib/types";
import { SHIPPING_LABEL, SHIPPING_STEPS } from "./merchStatus";

export function ShippingTimeline({
  status,
  trackingNo,
}: {
  status: ShippingStatus;
  trackingNo?: string;
}) {
  // กรณีพิเศษ: ยกเลิก ไม่ต้องแสดง Timeline
  if (status === "cancelled") {
    return <p className="rounded-lg bg-slate-100 p-3 text-slate-600">คำสั่งซื้อนี้ถูกยกเลิกแล้ว</p>;
  }

  const currentIndex = SHIPPING_STEPS.indexOf(status);

  return (
    <ol>
      {SHIPPING_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === SHIPPING_STEPS.length - 1;
        const showTrackingNo = step === "shipped" && trackingNo && index <= currentIndex;

        return (
          <li key={step} className="flex gap-3">
            {/* ซ้าย: จุด + เส้นเชื่อม */}
            <div className="flex flex-col items-center">
              <Dot isDone={isDone} isCurrent={isCurrent} />
              {!isLast && <Line isDone={isDone} />}
            </div>

            {/* ขวา: ชื่อสถานะ */}
            <div className="pb-6">
              <p className={isCurrent ? "font-semibold text-slate-900" : "text-slate-500"}>
                {SHIPPING_LABEL[step]}
              </p>
              {showTrackingNo && <p className="text-sm text-slate-500">เลขพัสดุ: {trackingNo}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Dot({ isDone, isCurrent }: { isDone: boolean; isCurrent: boolean }) {
  let color = "border-slate-300 bg-white"; // ยังไม่ถึง
  if (isDone) color = "border-green-600 bg-green-600"; // ผ่านแล้ว
  if (isCurrent) color = "border-blue-600 bg-white ring-4 ring-blue-600/20"; // ขั้นปัจจุบัน

  return <span className={`mt-0.5 h-4 w-4 rounded-full border-2 ${color}`} />;
}

function Line({ isDone }: { isDone: boolean }) {
  return <span className={`w-0.5 flex-1 ${isDone ? "bg-green-600" : "bg-slate-200"}`} />;
}
