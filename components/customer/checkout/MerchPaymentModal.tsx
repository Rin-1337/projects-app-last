"use client";

import { useState } from "react";
import { QRDisplay } from "@/components/shared/QRDisplay";
import { Button, Modal } from "@/components/ui";
import { confirmOnlinePayment } from "@/lib/services/merch";
import type { MerchOrder } from "@/lib/types";

/**
 * หน้าต่างชำระเงินค่าสินค้าด้วย QR
 * หน้าตาเหมือน PaymentModal ของหน้าซื้อบัตร แต่เรียก confirmOnlinePayment() ของร้านค้าแทน
 * ระบบนี้เป็นตัวต้นแบบ ไม่ได้ต่อธนาคารจริง จึงมีปุ่ม "จำลองชำระสำเร็จ" แทนการสแกนจ่าย
 */
export function MerchPaymentModal({
  order,
  onPaid,
  onCancel,
}: {
  order: MerchOrder;
  onPaid: (paidOrder: MerchOrder) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");

  // จำนวนชิ้นทั้งหมดในคำสั่งซื้อ
  let totalQuantity = 0;
  for (const item of order.items) {
    totalQuantity = totalQuantity + item.quantity;
  }

  function handlePay() {
    // confirmOnlinePayment จะ throw Error ถ้าจ่ายไม่ได้ เช่น สินค้าหมดระหว่างรอจ่าย
    // ถ้าจ่ายสำเร็จ ระบบจะตัดสต็อกให้เอง
    try {
      const paidOrder = confirmOnlinePayment(order.id);
      onPaid(paidOrder);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ชำระเงินไม่สำเร็จ");
      }
    }
  }

  return (
    <Modal open onClose={onCancel} title="ชำระเงินด้วย QR">
      <div className="space-y-5">
        <QRDisplay value={`PAY:${order.id}`} size={180} label="สแกนเพื่อชำระเงิน" />

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">ยอดที่ต้องชำระ ({totalQuantity} ชิ้น)</span>
          <span className="text-xl font-bold text-slate-900">
            {order.total.toLocaleString()} บาท
          </span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button className="flex-1" onClick={handlePay}>
            จำลองชำระสำเร็จ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
