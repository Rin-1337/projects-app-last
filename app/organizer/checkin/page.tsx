"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Card, CardTitle, Input } from "@/components/ui";
import { checkIn } from "@/lib/services/tickets";
import { useStore } from "@/lib/useStore";

// ผลการสแกนล่าสุด: ok บอกสีเขียว/แดง, message คือข้อความหลัก, detail คือข้อมูลเสริม
type Result = { ok: boolean; message: string; detail?: string };

export default function OrganizerCheckinPage() {
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  const events = useStore("events");
  const tickets = useStore("tickets");
  const ticketTypes = useStore("ticketTypes");
  const myEvents = events.filter((e) => e.organizerId === organizerId);

  // งานที่ผู้ใช้เลือกใน dropdown ("" = ยังไม่เลือก)
  const [pickedEventId, setPickedEventId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  // งานที่ใช้จริง: ถ้าที่เลือกไว้ไม่อยู่ในงานของเรา ให้ใช้งานแรกแทน
  // คำนวณจาก state ได้เลย จึงไม่ต้องเก็บเป็น state เพิ่ม
  const eventId = myEvents.some((e) => e.id === pickedEventId)
    ? pickedEventId
    : (myEvents[0]?.id ?? "");

  // นับบัตรของงานนี้ ใช้แสดง "เช็กอินแล้ว X / Y คน"
  const eventTickets = tickets.filter((t) => t.eventId === eventId);
  const checkedInCount = eventTickets.filter((t) => t.checkedIn).length;

  function handleCheckIn() {
    if (eventId === "") return;

    if (qrCode.trim() === "") {
      setResult({ ok: false, message: "กรุณากรอกรหัส QR บนบัตร" });
      return;
    }

    // checkIn ไม่ throw แต่คืน { ok: true, ticket } | { ok: false, reason }
    // เพราะสแกนผิดเป็นเรื่องปกติหน้างาน จึงใช้ if (!res.ok) แทน try/catch
    const res = checkIn(qrCode, eventId);

    // ไม่ผ่าน → แสดงเหตุผลจาก service (ไม่ล้างช่อง จะได้แก้รหัสที่พิมพ์ผิดได้)
    if (!res.ok) {
      setResult({ ok: false, message: res.reason });
      return;
    }

    // ถึงตรงนี้ TypeScript รู้แล้วว่าเป็นแบบ ok: true จึงใช้ res.ticket ได้
    const typeName =
      ticketTypes.find((t) => t.id === res.ticket.ticketTypeId)?.name ?? "-";
    setResult({
      ok: true,
      message: "เช็กอินสำเร็จ",
      detail: `${res.ticket.attendeeName} · บัตร${typeName}`,
    });
    setQrCode(""); // ล้างช่องให้พร้อมสแกนใบถัดไป
  }

  if (myEvents.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center text-slate-500">
          ยังไม่มี Event ที่คุณรับผิดชอบ จึงยังเช็กอินไม่ได้
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>เช็กอินผู้เข้าร่วมงาน</CardTitle>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleCheckIn();
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="checkinEvent" className="text-sm text-slate-600">
              งานที่กำลังเช็กอิน
            </label>
            <select
              id="checkinEvent"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={eventId}
              onChange={(e) => {
                setPickedEventId(e.target.value);
                setResult(null); // เปลี่ยนงานแล้วผลเก่าไม่เกี่ยวแล้ว
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
            label="รหัส QR บนบัตร (เช่น TICKET:tk_demo1)"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
          />

          <Button type="submit">เช็กอิน</Button>
        </form>

        <p className="mt-3 text-sm text-slate-600">
          เช็กอินแล้ว {checkedInCount} / {eventTickets.length} คน
        </p>
      </Card>

      {result && (
        <div
          className={
            result.ok
              ? "rounded-xl border border-green-300 bg-green-50 p-6 text-center text-green-800"
              : "rounded-xl border border-red-300 bg-red-50 p-6 text-center text-red-700"
          }
        >
          <p className="text-2xl font-semibold">
            {result.ok ? "✅ " : "❌ "}
            {result.message}
          </p>
          {result.detail && <p className="mt-1 text-lg">{result.detail}</p>}
        </div>
      )}
    </div>
  );
}