"use client";

import { useState } from "react";
import { QRDisplay } from "@/components/shared/QRDisplay";
import { Button, Modal } from "@/components/ui";
import { confirmTicketPayment } from "@/lib/services/tickets";
import type { Ticket, TicketOrder } from "@/lib/types";

/**
 * หน้าต่างชำระเงินด้วย QR
 * ระบบนี้เป็นตัวต้นแบบ ไม่ได้ต่อธนาคารจริง จึงมีปุ่ม "จำลองชำระสำเร็จ" แทนการสแกนจ่าย
 */
export function PaymentModal({
  order,
  onPaid,
  onCancel,
}: {
  order: TicketOrder;
  onPaid: (tickets: Ticket[]) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");

  function handlePay() {
    // confirmTicketPayment จะ throw Error ถ้าจ่ายไม่ได้ เช่น บัตรหมดระหว่างรอจ่าย
    try {
      const tickets = confirmTicketPayment(order.id);
      onPaid(tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ชำระเงินไม่สำเร็จ");
    }
  }

  return (
    <Modal open onClose={onCancel} title="ชำระเงินด้วย QR">
      <div className="space-y-5">
        <QRDisplay value={`PAY:${order.id}`} size={180} label="สแกนเพื่อชำระเงิน" />

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-600">ยอดที่ต้องชำระ ({order.quantity} ใบ)</span>
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
