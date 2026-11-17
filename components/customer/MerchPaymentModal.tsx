"use client";

import { useState } from "react";
import { QRDisplay } from "@/components/shared/QRDisplay";
import { Button, Modal } from "@/components/ui";
import { confirmOnlinePayment } from "@/lib/services/merch";
import type { MerchOrder } from "@/lib/types";

/**
 * หน้าต่างชำระเงินด้วย QR สำหรับคำสั่งซื้อเสื้อ/ของที่ระลึก
 * ผู้รับผิดชอบ: ทิวากร — หน้าตาเหมือน PaymentModal ของบัตร แต่เรียก confirmOnlinePayment
 */
export function MerchPaymentModal({
  order,
  onPaid,
  onCancel,
}: {
  order: MerchOrder;
  onPaid: (paid: MerchOrder) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  function handlePay() {
    // confirmOnlinePayment จะ throw Error ถ้าจ่ายไม่ได้ เช่น ของหมดระหว่างรอจ่าย
    try {
      onPaid(confirmOnlinePayment(order.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ชำระเงินไม่สำเร็จ");
    }
  }

  return (
    <Modal open onClose={onCancel} title="ชำระเงินด้วย QR">
      <div className="space-y-5">
        <QRDisplay value={`PAY:${order.id}`} size={180} label="สแกนเพื่อชำระเงิน" />

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">ยอดที่ต้องชำระ ({itemCount} ชิ้น)</span>
          <span className="text-xl font-bold text-slate-900">{order.total.toLocaleString()} บาท</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            ชำระภายหลัง
          </Button>
          <Button className="flex-1" onClick={handlePay}>
            จำลองชำระสำเร็จ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
