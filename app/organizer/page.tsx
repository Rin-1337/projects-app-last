"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Badge, Card, CardTitle } from "@/components/ui";
import type { EventStatus } from "@/lib/types";
import { useStore } from "@/lib/useStore";

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "ฉบับร่าง",
  published: "เปิดขาย",
  closed: "ปิดขาย",
};

// จัดตัวเลขให้อ่านง่าย เช่น 1,200
const fmt = (n: number) => n.toLocaleString("th-TH");

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");
  const orders = useStore("ticketOrders");
  const tickets = useStore("tickets");

  const myEvents = events.filter((e) => e.organizerId === organizerId);

  // สรุปตัวเลขของแต่ละงาน (คำนวณตอนวาดหน้า ไม่เก็บเป็น state)
  const stats = myEvents.map((ev) => {
    // นับเฉพาะคำสั่งซื้อที่ "จ่ายแล้ว"
    const paidOrders = orders.filter(
      (o) => o.eventId === ev.id && o.paymentStatus === "paid",
    );
    const paidOrderIds = new Set(paidOrders.map((o) => o.id));
    // ผู้เข้าร่วม = บัตรของคำสั่งซื้อที่จ่ายแล้ว
    const attendees = tickets.filter(
      (t) => t.eventId === ev.id && paidOrderIds.has(t.orderId),
    );
    return {
      event: ev,
      sold: paidOrders.reduce((sum, o) => sum + o.quantity, 0),
      quota: ticketTypes
        .filter((t) => t.eventId === ev.id)
        .reduce((sum, t) => sum + t.quota, 0),
      revenue: paidOrders.reduce((sum, o) => sum + o.total, 0),
      attendees: attendees.length,
      checkedIn: attendees.filter((t) => t.checkedIn).length,
    };
  });

  // ยอดรวมทุกงานที่รับผิดชอบ
  const totalSold = stats.reduce((sum, s) => sum + s.sold, 0);
  const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);
  const totalAttendees = stats.reduce((sum, s) => sum + s.attendees, 0);
  const totalCheckedIn = stats.reduce((sum, s) => sum + s.checkedIn, 0);

  if (myEvents.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-slate-500">
          ยังไม่มี Event ที่คุณรับผิดชอบ
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-600">Event ที่รับผิดชอบ</p>
          <p className="mt-1 text-2xl font-semibold">{fmt(myEvents.length)} งาน</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-600">บัตรที่ขายได้</p>
          <p className="mt-1 text-2xl font-semibold">{fmt(totalSold)} ใบ</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-600">รายได้จากบัตร</p>
          <p className="mt-1 text-2xl font-semibold">{fmt(totalRevenue)} บาท</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-600">เช็กอินแล้ว</p>
          <p className="mt-1 text-2xl font-semibold">
            {fmt(totalCheckedIn)} / {fmt(totalAttendees)} คน
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>ภาพรวมแต่ละ Event</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ชื่องาน</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                <th className="py-2 pr-4 text-right font-medium">บัตรขายแล้ว / โควตา</th>
                <th className="py-2 pr-4 text-right font-medium">รายได้ (บาท)</th>
                <th className="py-2 pr-4 text-right font-medium">เช็กอิน</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.event.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{s.event.title}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={s.event.status === "published" ? "green" : "gray"}>
                      {STATUS_LABEL[s.event.status]}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {fmt(s.sold)} / {fmt(s.quota)}
                  </td>
                  <td className="py-2 pr-4 text-right">{fmt(s.revenue)}</td>
                  <td className="py-2 pr-4 text-right">
                    {fmt(s.checkedIn)} / {fmt(s.attendees)}
                  </td>
                  <td className="py-2 text-right">
                    <Link
                      href={`/organizer/events/${s.event.id}`}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      ประเภทบัตร
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}