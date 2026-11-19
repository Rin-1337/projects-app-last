"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BuyTicketForm } from "@/components/customer/events/BuyTicketForm";
import { Flyer, getEventColor } from "@/components/customer/common/Flyer";
import { formatEventDate } from "@/components/customer/common/formatEventDate";
import { PaymentModal } from "@/components/customer/events/PaymentModal";
import type { Ticket, TicketOrder } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้ารายละเอียด Event + ซื้อบัตร — ผู้รับผิดชอบ: ทิวากร
//
// ขั้นตอนบนหน้านี้
//   1. กรอกฟอร์มซื้อบัตร (BuyTicketForm)      → ได้ order สถานะรอชำระ
//   2. หน้าต่างชำระเงิน (PaymentModal)        → กดจำลองชำระสำเร็จ ได้ tickets
//   3. แสดงข้อความซื้อสำเร็จ + ลิงก์ไปหน้าบัตรของฉัน
//
// หน้าตาแบบ Posh: พื้นดำ (theme posh-dark) ใบปิดใหญ่ซ้าย ข้อมูลงาน + ฟอร์มซื้อบัตรขวา

export default function CustomerEventDetailPage() {
  // useParams ต้องอยู่ใน Suspense เพราะโปรเจคเปิด cacheComponents
  // (Next.js ไม่รู้ id ล่วงหน้าตอน build) จึงแยกเนื้อหาไปไว้ใน EventDetail ด้านล่าง
  return (
    <Suspense fallback={<div data-theme="posh-dark" className="min-h-screen bg-base-100" />}>
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
      <div data-theme="posh-dark" className="min-h-screen bg-base-100 text-base-content">
        <div className="mx-auto max-w-300 px-5 pt-6 pb-24 sm:px-10">
          <BackLink />
          <p className="mt-6 rounded-2xl bg-base-200 p-6 text-center text-base-content/60">
            ไม่พบงานนี้ หรืองานปิดการขายแล้ว
          </p>
        </div>
      </div>
    );
  }

  // จำนวนคนที่จะไป = บัตรที่ขายไปแล้วของทุกประเภทรวมกัน
  let going = 0;
  for (const ticketType of ticketTypes) {
    going += ticketType.sold;
  }

  function handlePaid(newTickets: Ticket[]) {
    setOrder(null);
    setTickets(newTickets);
  }

  return (
    <div data-theme="posh-dark" className="min-h-screen bg-base-100 text-base-content">
      <div className="mx-auto max-w-300 px-5 pt-6 pb-24 sm:px-10">
        <BackLink />

        <div className="mt-7 flex flex-wrap items-start gap-14">
          {/* ───── ซ้าย: ใบปิดงาน ───── */}
          <div className="aspect-4/5 w-full max-w-115 min-w-0 flex-[1_1_360px] overflow-hidden rounded-lg">
            <Flyer event={event} size="xl" />
          </div>

          {/* ───── ขวา: ข้อมูลงาน + ซื้อบัตร ───── */}
          <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-7">
            <div className="flex flex-col gap-2">
              <h1 className="text-[44px] leading-[1.02] font-normal tracking-[-0.045em] sm:text-[64px]">
                {event.title}
              </h1>
              <p className="text-base text-base-content/60">{formatEventDate(event.startAt)}</p>
              <p className="text-base text-base-content/60">{event.location}</p>
              <p className="mt-1 text-[15px]">{going.toLocaleString()} คนกำลังจะไป</p>
            </div>

            {/* ซื้อสำเร็จแล้วแสดงข้อความแทนฟอร์ม */}
            {tickets ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-base-200 p-6 text-center">
                <p className="text-xl text-success">ชำระเงินสำเร็จ</p>
                <p className="text-sm text-base-content/60">ได้รับบัตรแล้ว {tickets.length} ใบ</p>
                <div className="flex gap-2">
                  <Link href="/customer/tickets" className="btn btn-neutral font-normal">
                    ดูบัตรของฉัน
                  </Link>
                  <button type="button" onClick={() => setTickets(null)} className="btn bg-base-300 font-normal">
                    ซื้อเพิ่ม
                  </button>
                </div>
              </div>
            ) : (
              <BuyTicketForm
                ticketTypes={ticketTypes}
                accent={getEventColor(event.id).accent}
                onOrderCreated={setOrder}
              />
            )}

            <section className="flex flex-col gap-2.5 border-t border-base-300 pt-6">
              <h2 className="text-xl font-medium">เกี่ยวกับงาน</h2>
              <p className="text-base leading-[1.75] whitespace-pre-line text-[#D4D4D4]">{event.description}</p>
            </section>
          </div>
        </div>
      </div>

      {order && <PaymentModal order={order} onPaid={handlePaid} onCancel={() => setOrder(null)} />}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/customer/events" className="text-sm text-base-content/60 hover:text-base-content">
      ← รายการ Event
    </Link>
  );
}
