"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Badge, Card, CardTitle, Input } from "@/components/ui";
import { useStore } from "@/lib/useStore";

export default function OrganizerAttendeesPage() {
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  const events = useStore("events");
  const tickets = useStore("tickets");
  const orders = useStore("ticketOrders");
  const ticketTypes = useStore("ticketTypes");
  const users = useStore("users");
  const myEvents = events.filter((e) => e.organizerId === organizerId);

  // งานที่ผู้ใช้เลือกใน dropdown ("" = ยังไม่เลือก) และคำค้นหา
  const [pickedEventId, setPickedEventId] = useState("");
  const [search, setSearch] = useState("");

  // งานที่ใช้จริง: ถ้าที่เลือกไว้ไม่อยู่ในงานของเรา ให้ใช้งานแรกแทน
  const eventId = myEvents.some((e) => e.id === pickedEventId)
    ? pickedEventId
    : (myEvents[0]?.id ?? "");

  // บัตรจะนับเป็นผู้เข้าร่วมเมื่อคำสั่งซื้อของมัน "จ่ายแล้ว" เท่านั้น
  // (ตัดคำสั่งซื้อที่ยกเลิกหรือคืนเงินออก)
  const paidOrderIds = new Set(
    orders
      .filter((o) => o.eventId === eventId && o.paymentStatus === "paid")
      .map((o) => o.id),
  );
  const attendees = tickets.filter(
    (t) => t.eventId === eventId && paidOrderIds.has(t.orderId),
  );

  // ค้นหาจากชื่อผู้เข้าร่วมหรือรหัส QR (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
  const keyword = search.trim().toLowerCase();
  const shown =
    keyword === ""
      ? attendees
      : attendees.filter(
          (t) =>
            t.attendeeName.toLowerCase().includes(keyword) ||
            t.qrCode.toLowerCase().includes(keyword),
        );

  const checkedInCount = attendees.filter((t) => t.checkedIn).length;

  // แปลง id เป็นชื่อที่คนอ่านรู้เรื่อง ไม่เจอแสดง "-" (หน้าไม่พัง)
  function typeName(id: string) {
    return ticketTypes.find((t) => t.id === id)?.name ?? "-";
  }
  function buyerName(id: string) {
    return users.find((u) => u.id === id)?.name ?? "-";
  }

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
        <CardTitle>ผู้เข้าร่วมงาน</CardTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="attendeeEvent" className="text-sm text-slate-600">
              งาน
            </label>
            <select
              id="attendeeEvent"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={eventId}
              onChange={(e) => {
                setPickedEventId(e.target.value);
                setSearch("");
              }}
            >
              {myEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="ค้นหาชื่อหรือรหัส QR"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p className="mt-3 text-sm text-slate-600">
          ผู้เข้าร่วมที่จ่ายแล้ว {attendees.length} คน · เช็กอินแล้ว{" "}
          {checkedInCount} คน
        </p>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ชื่อผู้เข้าร่วม</th>
                <th className="py-2 pr-4 font-medium">ประเภทบัตร</th>
                <th className="py-2 pr-4 font-medium">ผู้ซื้อ</th>
                <th className="py-2 pr-4 font-medium">รหัส QR</th>
                <th className="py-2 font-medium">เช็กอิน</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{t.attendeeName}</td>
                  <td className="py-2 pr-4">{typeName(t.ticketTypeId)}</td>
                  <td className="py-2 pr-4">{buyerName(t.customerId)}</td>
                  <td className="py-2 pr-4">{t.qrCode}</td>
                  <td className="py-2">
                    <Badge tone={t.checkedIn ? "green" : "gray"}>
                      {t.checkedIn ? "เช็กอินแล้ว" : "ยังไม่เช็กอิน"}
                    </Badge>
                    {t.checkedIn && t.checkedInAt && (
                      <span className="ml-2 text-xs text-slate-500">
                        {new Date(t.checkedInAt).toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendees.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            ยังไม่มีผู้เข้าร่วมที่จ่ายเงินแล้ว
          </p>
        )}
        {attendees.length > 0 && shown.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            ไม่พบผู้เข้าร่วมที่ตรงกับคำค้นหา
          </p>
        )}
      </Card>
    </div>
  );
}