"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Badge, Card, CardTitle } from "@/components/ui";
import { vendorSalesReport } from "@/lib/services/vendors";
import { useStore } from "@/lib/useStore";

// จัดตัวเลขให้อ่านง่าย เช่น 1,200
const fmt = (n: number) => n.toLocaleString("th-TH");

export default function OrganizerVendorsPage() {
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  const events = useStore("events");
  // vendorSalesReport อ่านข้อมูลจาก storage เอง จึงไม่ได้รับสัญญาณเมื่อข้อมูลเปลี่ยน
  // เรียก useStore 3 ชุดที่รายงานใช้ไว้ เพื่อให้หน้านี้วาดใหม่ทุกครั้งที่ข้อมูลเหล่านี้เปลี่ยน
  useStore("vendors");
  useStore("tokenTransactions");
  useStore("withdrawals");

  const myEvents = events.filter((e) => e.organizerId === organizerId);

  // งานที่ผู้ใช้เลือกใน dropdown ("" = ยังไม่เลือก)
  const [pickedEventId, setPickedEventId] = useState("");

  // งานที่ใช้จริง: ถ้าที่เลือกไว้ไม่อยู่ในงานของเรา ให้ใช้งานแรกแทน
  const eventId = myEvents.some((e) => e.id === pickedEventId)
    ? pickedEventId
    : (myEvents[0]?.id ?? "");

  // รายงานของทุกร้านในงานนี้ (eventId ว่าง = ได้อาร์เรย์ว่าง)
  const rows = vendorSalesReport(eventId);

  // ยอดรวมทุกร้าน
  const totalSales = rows.reduce((sum, r) => sum + r.salesCount, 0);
  const totalReceived = rows.reduce((sum, r) => sum + r.totalReceived, 0);
  const totalWithdrawn = rows.reduce((sum, r) => sum + r.totalWithdrawn, 0);
  const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);

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
        <CardTitle>ยอดขายร้านค้า</CardTitle>

        <div className="flex flex-col gap-1">
          <label htmlFor="vendorEvent" className="text-sm text-slate-600">
            งาน
          </label>
          <select
            id="vendorEvent"
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

        <p className="mt-3 text-sm text-slate-600">
          ใช้เคลียร์เงินกับร้านหลังจบงาน · ยอดที่ต้องเคลียร์ = Token ที่ร้านได้รับ
          − Token ที่ถอนเป็นเงินไปแล้ว (หน้านี้ดูได้อย่างเดียว)
        </p>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ร้าน</th>
                <th className="py-2 pr-4 font-medium">สินค้า</th>
                <th className="py-2 pr-4 font-medium">บูธ</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                <th className="py-2 pr-4 text-right font-medium">ขาย (ครั้ง)</th>
                <th className="py-2 pr-4 text-right font-medium">ได้รับ (Token)</th>
                <th className="py-2 pr-4 text-right font-medium">ถอนแล้ว (Token)</th>
                <th className="py-2 text-right font-medium">ต้องเคลียร์ (Token)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.vendor.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{r.vendor.shopName}</td>
                  <td className="py-2 pr-4">
                    {r.vendor.productName} ({r.vendor.priceToken} Token)
                  </td>
                  <td className="py-2 pr-4">{r.vendor.boothNo ?? "-"}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={r.vendor.active ? "green" : "gray"}>
                      {r.vendor.active ? "เปิดขาย" : "ปิดชั่วคราว"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-right">{fmt(r.salesCount)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.totalReceived)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(r.totalWithdrawn)}</td>
                  <td className="py-2 text-right font-medium">
                    {fmt(r.outstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="font-medium">
                  <td className="py-2 pr-4" colSpan={4}>
                    รวมทุกร้าน
                  </td>
                  <td className="py-2 pr-4 text-right">{fmt(totalSales)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(totalReceived)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(totalWithdrawn)}</td>
                  <td className="py-2 text-right">{fmt(totalOutstanding)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {rows.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            งานนี้ยังไม่มีร้านค้า
          </p>
        )}
      </Card>
    </div>
  );
}