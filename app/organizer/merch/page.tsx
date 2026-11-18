"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Card, CardTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";

// ผู้รับผิดชอบ: อรอนงค์

// ไซส์ที่เหลือไม่เกินจำนวนนี้ ถือว่าใกล้หมด
const LOW_STOCK = 5;

export default function OrganizerMerchPage() {
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

  // นับเฉพาะออเดอร์ที่ชำระแล้วของงานนี้
  const paidOrders = allOrders.filter(
    (o) => o.eventId === eventId && o.paymentStatus === "paid",
  );
  const boothOrders = paidOrders.filter((o) => o.channel === "booth");
  const onlineOrders = paidOrders.filter((o) => o.channel === "online");

  const sumTotal = (list: typeof paidOrders) =>
    list.reduce((sum, o) => sum + o.total, 0);
  const boothTotal = sumTotal(boothOrders);
  const onlineTotal = sumTotal(onlineOrders);

  // ออนไลน์ที่จ่ายแล้วแต่ยังไม่ได้ส่ง (รอเตรียมของ / กำลังเตรียมของ)
  const waitingShip = onlineOrders.filter(
    (o) => o.shippingStatus === "pending" || o.shippingStatus === "preparing",
  );

  // ไซส์ที่ใกล้หมดของสินค้าที่เปิดขาย น้อยสุดขึ้นก่อน
  const lowStock = allProducts
    .filter((p) => p.eventId === eventId && p.active)
    .flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= LOW_STOCK)
        .map((v) => ({ id: `${p.id}-${v.size}`, name: p.name, ...v })),
    )
    .sort((a, b) => a.stock - b.stock);

  if (myEvents.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-slate-500">
          ยังไม่มี Event ที่คุณรับผิดชอบ จึงยังดูภาพรวมไม่ได้
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {myEvents.length > 1 && (
        <Card>
          <div className="flex flex-col gap-1">
            <label htmlFor="overviewEvent" className="text-sm text-slate-600">
              งาน
            </label>
            <select
              id="overviewEvent"
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">ยอดขายรวม</p>
          <p className="mt-1 text-2xl font-semibold">
            {(boothTotal + onlineTotal).toLocaleString("th-TH")} บาท
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {paidOrders.length} ออเดอร์
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">ขายหน้าบูท</p>
          <p className="mt-1 text-2xl font-semibold">
            {boothTotal.toLocaleString("th-TH")} บาท
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {boothOrders.length} ออเดอร์
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">ขายออนไลน์</p>
          <p className="mt-1 text-2xl font-semibold">
            {onlineTotal.toLocaleString("th-TH")} บาท
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {onlineOrders.length} ออเดอร์
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>คำสั่งซื้อรอจัดส่ง ({waitingShip.length} รายการ)</CardTitle>
        {waitingShip.length === 0 ? (
          <p className="py-4 text-slate-500">ไม่มีออเดอร์ที่รอจัดส่ง</p>
        ) : (
          <p className="text-sm text-slate-600">
            มีออเดอร์ออนไลน์ที่ชำระแล้วและยังไม่ได้ส่ง{" "}
            <Link
              href="/organizer/merch/orders"
              className="text-blue-600 underline"
            >
              ไปอัปเดตสถานะจัดส่ง
            </Link>
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>
          สต็อกใกล้หมด (เหลือไม่เกิน {LOW_STOCK} ชิ้น)
        </CardTitle>
        {lowStock.length === 0 ? (
          <p className="py-4 text-slate-500">ไม่มีสินค้าที่ใกล้หมด</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">สินค้า</th>
                <th className="py-2 pr-4 font-medium">ไซส์</th>
                <th className="py-2 pr-4 font-medium">เหลือ</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{row.name}</td>
                  <td className="py-2 pr-4">{row.size}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={row.stock === 0 ? "gray" : "yellow"}>
                      {row.stock === 0 ? "หมด" : `${row.stock} ชิ้น`}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}