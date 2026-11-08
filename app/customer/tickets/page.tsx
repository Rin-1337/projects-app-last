"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEventDate } from "@/components/customer/formatEventDate";
import { TicketCard } from "@/components/customer/TicketCard";
import { QRDisplay } from "@/components/shared/QRDisplay";
import { Badge, Card, CardTitle, Modal, STATUS_TONE } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { PaymentStatus } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้าบัตรของฉัน — ผู้รับผิดชอบ: ทิวากร
// ส่วนบน:  บัตรทุกใบของผู้ใช้ แยกตามงาน กด "แสดง QR" เพื่อให้เจ้าหน้าที่สแกนเช็กอิน
// ส่วนล่าง: ประวัติการสั่งซื้อบัตร
//
// อ่านจาก useStore ตรง ๆ (ไม่ใช้ listTicketsByCustomer) เพื่อให้หน้าอัปเดตเองทันที
// เช่น เจ้าหน้าที่สแกนเช็กอินจากอีกแท็บ สถานะบนหน้านี้จะเปลี่ยนเป็น "เช็กอินแล้ว" เอง

/** ข้อความภาษาไทยของสถานะการชำระเงิน */
const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
  refunded: "คืนเงินแล้ว",
};

export default function CustomerTicketsPage() {
  const { user } = useAuth();
  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");
  const tickets = useStore("tickets");
  const orders = useStore("ticketOrders");

  // id ของบัตรที่กำลังเปิด QR อยู่ (null = ไม่ได้เปิด)
  // เก็บแค่ id แล้วค่อยหาบัตรจากข้อมูลล่าสุด สถานะเช็กอินในหน้าต่าง QR จะได้อัปเดตตามจริง
  const [qrTicketId, setQrTicketId] = useState<string | null>(null);

  if (!user) return null; // RoleGuard ใน layout รับประกันว่าล็อกอินแล้ว บรรทัดนี้มีไว้ให้ TypeScript รู้

  // เก็บเฉพาะของผู้ใช้คนนี้
  const myTickets = tickets.filter((ticket) => ticket.customerId === user.id);
  const myOrders = orders
    .filter((order) => order.customerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // ล่าสุดขึ้นก่อน

  const qrTicket = myTickets.find((ticket) => ticket.id === qrTicketId);

  // งานที่ผู้ใช้มีบัตร เรียงจากงานที่จะถึงก่อน
  const myEvents = events
    .filter((event) => myTickets.some((ticket) => ticket.eventId === event.id))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  /** หาชื่องานจาก id (ถ้างานถูกลบไปแล้วจะแสดง "-") */
  function getEventTitle(eventId: string) {
    return events.find((event) => event.id === eventId)?.title ?? "-";
  }

  /** หาชื่อประเภทบัตรจาก id */
  function getTicketTypeName(ticketTypeId: string) {
    return ticketTypes.find((ticketType) => ticketType.id === ticketTypeId)?.name ?? "-";
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">บัตรของฉัน</h1>

      {/* ───── บัตรแยกตามงาน ───── */}
      {myTickets.length === 0 && (
        <Card className="text-center">
          <p className="text-slate-600">ยังไม่มีบัตร</p>
          <Link
            href="/customer/events"
            className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline"
          >
            ไปเลือกซื้อบัตร
          </Link>
        </Card>
      )}

      {myEvents.map((event) => (
        <section key={event.id}>
          <h2 className="text-lg font-semibold text-slate-900">{event.title}</h2>
          <p className="text-sm text-slate-600">
            {formatEventDate(event.startAt)} · {event.location}
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {myTickets
              .filter((ticket) => ticket.eventId === event.id)
              .map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  ticketTypeName={getTicketTypeName(ticket.ticketTypeId)}
                  onShowQR={() => setQrTicketId(ticket.id)}
                />
              ))}
          </div>
        </section>
      ))}

      {/* ───── ประวัติการสั่งซื้อ ───── */}
      {myOrders.length > 0 && (
        <Card>
          <CardTitle>ประวัติการซื้อบัตร</CardTitle>

          <ul className="divide-y divide-slate-100">
            {myOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{getEventTitle(order.eventId)}</p>
                  <p className="text-slate-500">
                    บัตร {getTicketTypeName(order.ticketTypeId)} × {order.quantity} ·{" "}
                    {formatEventDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge tone={STATUS_TONE[order.paymentStatus]}>
                    {PAYMENT_LABEL[order.paymentStatus]}
                  </Badge>
                  <span className="font-semibold text-slate-900">
                    {order.total.toLocaleString()} บาท
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ───── หน้าต่าง QR สำหรับเช็กอิน ───── */}
      {qrTicket && (
        <Modal open onClose={() => setQrTicketId(null)} title={getEventTitle(qrTicket.eventId)}>
          <QRDisplay
            value={qrTicket.qrCode}
            label={`${qrTicket.attendeeName} · บัตร ${getTicketTypeName(qrTicket.ticketTypeId)}`}
          />
          {qrTicket.checkedIn && (
            <p className="mt-4 text-center text-sm text-green-700">บัตรใบนี้เช็กอินแล้ว</p>
          )}
        </Modal>
      )}
    </div>
  );
}
