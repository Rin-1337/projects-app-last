"use client";

import { useState } from "react";
import { Badge, Button, Card, CardTitle, Input, Modal } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { MerchOrder, PaymentStatus, ShippingStatus } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { updateShipping } from "@/lib/services/merch";

// ผู้รับผิดชอบ: อรอนงค์

const SHIPPING_LABEL: Record<ShippingStatus, string> = {
  pending: "รอดำเนินการ",
  preparing: "กำลังเตรียมของ",
  shipped: "ส่งแล้ว",
  delivered: "ถึงมือลูกค้าแล้ว",
  cancelled: "ยกเลิก",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
  refunded: "คืนเงินแล้ว",
};

// สถานะที่ Organizer เลือกได้ (ไม่รวม pending เพราะออเดอร์ที่จ่ายแล้วเริ่มที่ preparing)
const SHIPPING_OPTIONS: ShippingStatus[] = [
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrganizerMerchOrdersPage() {
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  const events = useStore("events");
  const myEvents = events.filter((e) => e.organizerId === organizerId);

  // งานที่ผู้ใช้เลือกใน dropdown ("" = ยังไม่เลือก)
  const [pickedEventId, setPickedEventId] = useState("");
  // งานที่ใช้จริง: ถ้าที่เลือกไว้ไม่อยู่ในงานของเรา ให้ใช้งานแรกแทน
  const eventId = myEvents.some((e) => e.id === pickedEventId)
    ? pickedEventId
    : (myEvents[0]?.id ?? "");

  const allOrders = useStore("merchOrders");
  const allProducts = useStore("merchProducts");
  const users = useStore("users");
  // editing = ออเดอร์ที่กำลังอัปเดต (null = Modal ปิด)
  const [editing, setEditing] = useState<MerchOrder | null>(null);
  const [status, setStatus] = useState<ShippingStatus>("preparing");
  const [trackingNo, setTrackingNo] = useState("");
  const [formError, setFormError] = useState("");

  // เฉพาะออเดอร์ออนไลน์ของงานนี้ ใหม่สุดขึ้นก่อน (sort บนสำเนา ไม่แก้ของเดิม)
  const orders = allOrders
    .filter((o) => o.eventId === eventId && o.channel === "online")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function customerName(customerId: string | null) {
    return users.find((u) => u.id === customerId)?.name ?? "-";
  }

  function itemsText(items: { productId: string; size: string; quantity: number }[]) {
    return items
      .map((item) => {
        const name =
          allProducts.find((p) => p.id === item.productId)?.name ?? "-";
        return `${name} ${item.size} × ${item.quantity}`;
      })
      .join(", ");
  }

  function openUpdate(order: MerchOrder) {
    setEditing(order);
    // ใส่ค่าเดิมไว้ในฟอร์ม
    setStatus(order.shippingStatus ?? "preparing");
    setTrackingNo(order.trackingNo ?? "");
    setFormError("");
  }

  function closeModal() {
    setEditing(null);
  }

  function handleSave() {
    if (!editing) return;
    try {
      // เลขพัสดุว่าง → ไม่ส่งไป service จะคงเลขเดิมไว้ (trackingNo ?? order.trackingNo)
      const tracking = trackingNo.trim();
      updateShipping(editing.id, status, tracking === "" ? undefined : tracking);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    }
  }

  if (myEvents.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-slate-500">
          ยังไม่มี Event ที่คุณรับผิดชอบ จึงยังดูคำสั่งซื้อไม่ได้
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {myEvents.length > 1 && (
        <Card>
          <div className="flex flex-col gap-1">
            <label htmlFor="ordersEvent" className="text-sm text-slate-600">
              งาน
            </label>
            <select
              id="ordersEvent"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={eventId}
              onChange={(e) => setPickedEventId(e.target.value)}
            >
              {myEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>คำสั่งซื้อออนไลน์ ({orders.length} รายการ)</CardTitle>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ลูกค้า</th>
                <th className="py-2 pr-4 font-medium">รายการ</th>
                <th className="py-2 pr-4 font-medium">ที่อยู่จัดส่ง</th>
                <th className="py-2 pr-4 font-medium">ยอด</th>
                <th className="py-2 pr-4 font-medium">ชำระเงิน</th>
                <th className="py-2 pr-4 font-medium">จัดส่ง</th>
                <th className="py-2 pr-4 font-medium">เลขพัสดุ</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{customerName(o.customerId)}</td>
                  <td className="py-2 pr-4">{itemsText(o.items)}</td>
                  <td className="py-2 pr-4">{o.shippingAddress ?? "-"}</td>
                  <td className="py-2 pr-4">{o.total} บาท</td>
                  <td className="py-2 pr-4">
                    <Badge tone={o.paymentStatus === "paid" ? "green" : "gray"}>
                      {PAYMENT_LABEL[o.paymentStatus]}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    {o.shippingStatus ? SHIPPING_LABEL[o.shippingStatus] : "-"}
                  </td>
                  <td className="py-2 pr-4">{o.trackingNo ?? "-"}</td>
                  <td className="py-2 text-right">                    
                    {o.paymentStatus === "paid" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openUpdate(o)}
                      >
                        อัปเดตจัดส่ง
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            ยังไม่มีคำสั่งซื้อออนไลน์
          </p>
        )}
      </Card>
      <Modal
        open={editing !== null}
        onClose={closeModal}
        title="อัปเดตการจัดส่ง"
      >
        <form
          className="space-y-4"
           onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="shippingStatus" className="text-sm text-slate-600">
              สถานะจัดส่ง
            </label>
            <select
              id="shippingStatus"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as ShippingStatus)}
            >
              {SHIPPING_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {SHIPPING_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="เลขพัสดุ (ไม่บังคับ)"
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
          />

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>
              ยกเลิก
            </Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}