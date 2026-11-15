"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Badge, Card, CardTitle } from "@/components/ui";
import { saveEvent } from "@/lib/services/events";
import { logAction } from "@/lib/services/audit";
import type { EventItem, EventStatus } from "@/lib/types";

// ชื่อ/สีสถานะ Event
const STATUS_LABEL: Record<EventStatus, string> = { draft: "ฉบับร่าง", published: "เปิดขาย", closed: "ปิดแล้ว" };
const STATUS_COLOR = { draft: "gray", published: "green", closed: "red" } as const;

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminEventsPage() {
  const { user } = useAuth();
  const events = useStore("events");
  const users = useStore("users");
  const ticketTypes = useStore("ticketTypes");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) return <p className="text-slate-500">กำลังโหลด...</p>
  const adminId = user.id;

  // Organizer ที่ใช้งานได้ (ไม่ถูกระงับ) > ใส่ใน dropdown
  const organizers = users.filter((u) => u.role === "organizer" && u.status === "active");
  // เรียงงานตามวันเริ่ม (งานที่ใกล้ถึงก่อน)
  const sorted = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));

  // หาชื่อผู้ใช้ (null = ยังไม่มีคนรับผิดชอบ)
  function nameOf(id: string | null) {
    return users.find((u) => u.id === id)?.name ?? "ยังไม่มีผู้รับผิดชอบ";
  }
  // บัตรที่ขายแล้วของงานนี้ (รวมทุกประเภทบัตร)
  function soldOf(eventId: string) {
    return ticketTypes.filter((t) => t.eventId === eventId).reduce((sum, t) => sum + t.sold, 0);
  }
  // เปลี่ยน Organizer > บันทึกผ่าน saveEvent ของเตย + เก็บ Audit Log
  function assign(event: EventItem, organizerId: string) {
    setError(""); setSuccess("");
    const nextId = organizerId || null; // "" (ตัวเลือกว่าง) > null
    try {
      saveEvent({ ...event, organizerId: nextId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      return;
    }
    logAction({ actorId: adminId, action: "event.assign", targetId: event.id, detail: `${event.title}: ${nameOf(event.organizerId)} → ${nameOf(nextId)}` });
    setSuccess("");
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Event ทั้งหมด ({events.length})</CardTitle>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
        {sorted.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">ยังไม่มี Event</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {sorted.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{ev.title}</p>
                    <Badge tone={STATUS_COLOR[ev.status]}>{STATUS_LABEL[ev.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{new Date(ev.startAt).toLocaleString("th-TH")} · {ev.location}</p>
                  <p className="text-sm text-slate-600">ขายบัตรแล้ว {soldOf(ev.id).toLocaleString()} ใบ</p>
                </div>
                {/* เลือกปุ๊บบันทึกเลย (onChange > assign) */}
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  Organizer ผู้รับผิดชอบ
                  <select
                    value={ev.organizerId ?? ""}
                    onChange={(e) => assign(ev, e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  >
                    <option value="">— ยังไม่มีผู้รับผิดชอบ —</option>
                    {organizers.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
