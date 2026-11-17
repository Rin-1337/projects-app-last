"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui";
import { useStore } from "@/lib/useStore";

const fmt = (n: number) => n.toLocaleString("th-TH");

// อัตราส่วนเป็น % ถ้าตัวหารเป็น 0 แสดง "-" (กันหารด้วยศูนย์)
const percent = (part: number, whole: number) =>
  whole === 0 ? "-" : `${Math.round((part / whole) * 100)}%`;

export default function OrganizerReportsPage() {
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");
  const orders = useStore("ticketOrders");
  const tickets = useStore("tickets");
  // ข้อมูลเสื้อและของที่ระลึกเป็นของอรอนงค์ อ่านอย่างเดียว
  const merchProducts = useStore("merchProducts");
  const merchOrders = useStore("merchOrders");

  const myEvents = events.filter((e) => e.organizerId === organizerId);

  // งานที่ผู้ใช้เลือกใน dropdown ("" = ยังไม่เลือก)
  const [pickedEventId, setPickedEventId] = useState("");

  // งานที่ใช้จริง: ถ้าที่เลือกไว้ไม่อยู่ในงานของเรา ให้ใช้งานแรกแทน
  const eventId = myEvents.some((e) => e.id === pickedEventId)
    ? pickedEventId
    : (myEvents[0]?.id ?? "");

  /* ───────────── บัตร: ยอดขาย ผู้เข้าร่วม เช็กอิน แยกตามประเภท ───────────── */
  const paidOrders = orders.filter(
    (o) => o.eventId === eventId && o.paymentStatus === "paid",
  );
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  const attendees = tickets.filter(
    (t) => t.eventId === eventId && paidOrderIds.has(t.orderId),
  );

  const typeRows = ticketTypes
    .filter((t) => t.eventId === eventId)
    .map((type) => {
      const typeOrders = paidOrders.filter((o) => o.ticketTypeId === type.id);
      const typeAttendees = attendees.filter((a) => a.ticketTypeId === type.id);
      return {
        type,
        sold: typeOrders.reduce((sum, o) => sum + o.quantity, 0),
        revenue: typeOrders.reduce((sum, o) => sum + o.total, 0),
        attendees: typeAttendees.length,
        checkedIn: typeAttendees.filter((a) => a.checkedIn).length,
      };
    });

  const totalQuota = typeRows.reduce((sum, r) => sum + r.type.quota, 0);
  const totalSold = typeRows.reduce((sum, r) => sum + r.sold, 0);
  const totalRevenue = typeRows.reduce((sum, r) => sum + r.revenue, 0);
  const totalAttendees = typeRows.reduce((sum, r) => sum + r.attendees, 0);
  const totalCheckedIn = typeRows.reduce((sum, r) => sum + r.checkedIn, 0);

  /* ───────────── เสื้อและของที่ระลึก (ข้อมูลของอรอนงค์) ─────────────
   * นับเฉพาะคำสั่งซื้อที่จ่ายแล้ว แยกช่องทางออนไลน์ / หน้าบูท */
  const paidMerchOrders = merchOrders.filter(
    (o) => o.eventId === eventId && o.paymentStatus === "paid",
  );
  const merchRows = merchProducts
    .filter((p) => p.eventId === eventId)
    .map((product) => {
      let online = 0;
      let booth = 0;
      let revenue = 0;
      for (const order of paidMerchOrders) {
        for (const item of order.items) {
          if (item.productId !== product.id) continue;
          if (order.channel === "online") online += item.quantity;
          else booth += item.quantity;
          revenue += item.unitPrice * item.quantity;
        }
      }
      return { product, online, booth, revenue };
    });

  const merchOnline = merchRows.reduce((sum, r) => sum + r.online, 0);
  const merchBooth = merchRows.reduce((sum, r) => sum + r.booth, 0);
  const merchRevenue = merchRows.reduce((sum, r) => sum + r.revenue, 0);

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
      <Card>
        <CardTitle>รายงานและสรุปผล</CardTitle>
        <div className="flex flex-col gap-1">
          <label htmlFor="reportEvent" className="text-sm text-slate-600">
            งาน
          </label>
          <select
            id="reportEvent"
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

      {/* ── 1. ยอดขายบัตรตามประเภท ── */}
      <Card>
        <CardTitle>ยอดขายบัตรตามประเภท</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ประเภทบัตร</th>
                <th className="py-2 pr-4 text-right font-medium">ราคา (บาท)</th>
                <th className="py-2 pr-4 text-right font-medium">โควตา</th>
                <th className="py-2 pr-4 text-right font-medium">ขายแล้ว</th>
                <th className="py-2 pr-4 text-right font-medium">คงเหลือ</th>
                <th className="py-2 text-right font-medium">รายได้ (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {typeRows.map((r) => (
                <tr key={r.type.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{r.type.name}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.type.price)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.type.quota)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.sold)}</td>
                  <td className="py-2 pr-4 text-right">
                    {fmt(r.type.quota - r.sold)}
                  </td>
                  <td className="py-2 text-right">{fmt(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
            {typeRows.length > 0 && (
              <tfoot>
                <tr className="font-medium">
                  <td className="py-2 pr-4" colSpan={2}>
                    รวม
                  </td>
                  <td className="py-2 pr-4 text-right">{fmt(totalQuota)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(totalSold)}</td>
                  <td className="py-2 pr-4 text-right">
                    {fmt(totalQuota - totalSold)}
                  </td>
                  <td className="py-2 text-right">{fmt(totalRevenue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {typeRows.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            งานนี้ยังไม่มีประเภทบัตร
          </p>
        )}
      </Card>

      {/* ── 2. จำนวนผู้เข้าร่วม / เช็กอิน ── */}
      <Card>
        <CardTitle>จำนวนผู้เข้าร่วม / เช็กอิน</CardTitle>
        <p className="mb-3 text-sm text-slate-600">
          ผู้เข้าร่วมที่จ่ายแล้ว {fmt(totalAttendees)} คน · เช็กอินแล้ว{" "}
          {fmt(totalCheckedIn)} คน ({percent(totalCheckedIn, totalAttendees)})
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ประเภทบัตร</th>
                <th className="py-2 pr-4 text-right font-medium">ผู้เข้าร่วม</th>
                <th className="py-2 pr-4 text-right font-medium">เช็กอินแล้ว</th>
                <th className="py-2 text-right font-medium">อัตราเช็กอิน</th>
              </tr>
            </thead>
            <tbody>
              {typeRows.map((r) => (
                <tr key={r.type.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{r.type.name}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.attendees)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.checkedIn)}</td>
                  <td className="py-2 text-right">
                    {percent(r.checkedIn, r.attendees)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 3. สรุปยอดขายเสื้อ (จากอรอนงค์) ── */}
      <Card>
        <CardTitle>สรุปยอดขายเสื้อและของที่ระลึก</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">สินค้า</th>
                <th className="py-2 pr-4 text-right font-medium">ราคา (บาท)</th>
                <th className="py-2 pr-4 text-right font-medium">ออนไลน์ (ชิ้น)</th>
                <th className="py-2 pr-4 text-right font-medium">หน้าบูท (ชิ้น)</th>
                <th className="py-2 pr-4 text-right font-medium">รวม (ชิ้น)</th>
                <th className="py-2 text-right font-medium">รายได้ (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {merchRows.map((r) => (
                <tr key={r.product.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{r.product.name}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.product.price)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.online)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.booth)}</td>
                  <td className="py-2 pr-4 text-right">
                    {fmt(r.online + r.booth)}
                  </td>
                  <td className="py-2 text-right">{fmt(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
            {merchRows.length > 0 && (
              <tfoot>
                <tr className="font-medium">
                  <td className="py-2 pr-4" colSpan={2}>
                    รวม
                  </td>
                  <td className="py-2 pr-4 text-right">{fmt(merchOnline)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(merchBooth)}</td>
                  <td className="py-2 pr-4 text-right">
                    {fmt(merchOnline + merchBooth)}
                  </td>
                  <td className="py-2 text-right">{fmt(merchRevenue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {merchRows.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            งานนี้ยังไม่มีสินค้า
          </p>
        )}
      </Card>
    </div>
  );
}