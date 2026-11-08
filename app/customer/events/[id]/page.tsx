"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BuyTicketForm } from "@/components/customer/BuyTicketForm";
import { formatEventDate } from "@/components/customer/formatEventDate";
import { PaymentModal } from "@/components/customer/PaymentModal";
import { Card } from "@/components/ui";
import type { Ticket, TicketOrder } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้ารายละเอียด Event + ซื้อบัตร — ผู้รับผิดชอบ: ทิวากร
//
// ขั้นตอนบนหน้านี้
//   1. กรอกฟอร์มซื้อบัตร (BuyTicketForm)      → ได้ order สถานะรอชำระ
//   2. หน้าต่างชำระเงิน (PaymentModal)        → กดจำลองชำระสำเร็จ ได้ tickets
//   3. แสดงข้อความซื้อสำเร็จ + ลิงก์ไปหน้าบัตรของฉัน

export default function CustomerEventDetailPage() {
  // useParams ต้องอยู่ใน Suspense เพราะโปรเจคเปิด cacheComponents
  // (Next.js ไม่รู้ id ล่วงหน้าตอน build) จึงแยกเนื้อหาไปไว้ใน EventDetail ด้านล่าง
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-200" />}>
      <EventDetail />
    </Suspense>
  );
}

function EventDetail() {
  // id มาจาก URL เช่น /customer/events/ev_reunion → id = "ev_reunion"
  const { id } = useParams<{ id: string }>();

  // อ่านจาก useStore ตรง ๆ เพราะ getEvent / listTicketTypes ใน lib/services/events.ts ยังไม่ได้เขียน
  const events = useStore("events");
  const allTicketTypes = useStore("ticketTypes");

  // order = คำสั่งซื้อที่รอจ่าย (มีค่า = เปิดหน้าต่างชำระเงิน)
  const [order, setOrder] = useState<TicketOrder | null>(null);
  // tickets = บัตรที่เพิ่งได้หลังจ่ายเงิน (มีค่า = ซื้อสำเร็จ)
  const [tickets, setTickets] = useState<Ticket[] | null>(null);

  const event = events.find((e) => e.id === id && e.status === "published");
  const ticketTypes = allTicketTypes.filter((t) => t.eventId === id);

  if (!event) {
    return (
      <Card className="text-center">
        <p className="text-slate-600">ไม่พบงานนี้ หรืองานปิดการขายแล้ว</p>
        <BackLink />
      </Card>
    );
  }

  function handlePaid(newTickets: Ticket[]) {
    setOrder(null);
    setTickets(newTickets);
  }

  return (
    <div className="space-y-5">
      <BackLink />

      {/* ข้อมูลงาน */}
      <Card>
        <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{formatEventDate(event.startAt)}</p>
        <p className="text-sm text-slate-600">{event.location}</p>
        <p className="mt-4 whitespace-pre-line text-slate-700">{event.description}</p>
      </Card>

      {/* ซื้อสำเร็จแล้วแสดงข้อความแทนฟอร์ม */}
      {tickets ? (
        <Card className="space-y-3 text-center">
          <p className="text-lg font-semibold text-green-700">ชำระเงินสำเร็จ</p>
          <p className="text-sm text-slate-600">ได้รับบัตรแล้ว {tickets.length} ใบ</p>
          <div className="flex justify-center gap-4 text-sm font-medium">
            <Link href="/customer/tickets" className="text-blue-700 hover:underline">
              ดูบัตรของฉัน
            </Link>
            <button onClick={() => setTickets(null)} className="text-slate-600 hover:underline">
              ซื้อเพิ่ม
            </button>
          </div>
        </Card>
      ) : (
        <BuyTicketForm ticketTypes={ticketTypes} onOrderCreated={setOrder} />
      )}

      {order && (
        <PaymentModal order={order} onPaid={handlePaid} onCancel={() => setOrder(null)} />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/customer/events" className="mt-2 inline-block text-sm text-blue-700 hover:underline">
      ← กลับไปรายการ Event
    </Link>
  );
}
