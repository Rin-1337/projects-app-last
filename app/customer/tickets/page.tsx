"use client";

import Link from "next/link";
import { useState } from "react";
import { Flyer } from "@/components/customer/common/Flyer";
import { formatEventDate } from "@/components/customer/common/formatEventDate";
import { TicketCard } from "@/components/customer/tickets/TicketCard";
import { QRDisplay } from "@/components/shared/QRDisplay";
import { Modal } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { PaymentStatus } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้าบัตรของฉัน — ผู้รับผิดชอบ: ทิวากร
// ส่วนบน:  บัตรทุกใบของผู้ใช้ แยกตามงาน กด "แสดง QR" เพื่อให้เจ้าหน้าที่สแกนเช็กอิน
// ส่วนล่าง: ประวัติการสั่งซื้อบัตร
//
// อ่านจาก useStore ตรง ๆ (ไม่ใช้ listTicketsByCustomer) เพื่อให้หน้าอัปเดตเองทันที
// เช่น เจ้าหน้าที่สแกนเช็กอินจากอีกแท็บ สถานะบนหน้านี้จะเปลี่ยนเป็น "เช็กอินแล้ว" เอง
//
// หน้าตาแบบ Posh: พื้นดำ (theme posh-dark)

/** ข้อความภาษาไทยของสถานะการชำระเงิน */
const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
  refunded: "คืนเงินแล้ว",
};

/** สีป้ายสถานะการชำระเงิน (บนพื้นดำ) */
const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  pending: "bg-[#33290A] text-[#FCD34D]",
  paid: "bg-[#12301F] text-[#6EE7B7]",
  cancelled: "bg-base-300 text-base-content/80",
  refunded: "bg-base-300 text-base-content/80",
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
    <div data-theme="posh-dark" className="min-h-screen bg-base-100 text-base-content">
      <div className="mx-auto max-w-250 px-5 pt-6 pb-24 sm:px-10">
        <h1 className="mb-12 text-[56px] leading-none font-normal tracking-[-0.055em] sm:text-[88px] lg:text-[112px]">
          บัตรของฉัน.
        </h1>

        {/* ───── บัตรแยกตามงาน ───── */}
        {myTickets.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-base-200 p-6 text-center">
            <p className="text-base-content/60">ยังไม่มีบัตร</p>
            <Link href="/customer/events" className="btn btn-neutral font-normal">
              ไปเลือกซื้อบัตร
            </Link>
          </div>
        )}

        <div className="space-y-10">
          {myEvents.map((event) => (
            <section key={event.id} className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded">
                  <Flyer event={event} size="xs" />
                </div>
                <div>
                  <h2 className="text-[26px] font-normal tracking-[-0.02em]">{event.title}</h2>
                  <p className="text-sm text-base-content/60">
                    {formatEventDate(event.startAt)} · {event.location}
                  </p>
                </div>
              </div>

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
            </section>
          ))}
        </div>

        {/* ───── ประวัติการสั่งซื้อ ───── */}
        {myOrders.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-3 text-[32px] font-normal tracking-[-0.03em]">ประวัติการซื้อบัตร</h2>

            <ul>
              {myOrders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-4 border-b border-base-300 py-4">
                  <div className="min-w-48 flex-1">
                    <p>{getEventTitle(order.eventId)}</p>
                    <p className="text-sm text-base-content/60">
                      บัตร {getTicketTypeName(order.ticketTypeId)} × {order.quantity} ·{" "}
                      {formatEventDate(order.createdAt)}
                    </p>
                  </div>
                  <span>{order.total.toLocaleString()} บาท</span>
                  <span className={`rounded-full px-3 py-1.5 text-[13px] leading-none ${PAYMENT_BADGE[order.paymentStatus]}`}>
                    {PAYMENT_LABEL[order.paymentStatus]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

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
