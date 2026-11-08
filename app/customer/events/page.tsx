"use client";

import { useState } from "react";
import { EventCard } from "@/components/customer/EventCard";
import { getPublishedEvents } from "@/components/customer/getPublishedEvents";
import { Input } from "@/components/ui";
import type { EventItem } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้ารายการ Event — ผู้รับผิดชอบ: ทิวากร
// แสดงงานที่เปิดขายทั้งหมด พร้อมประเภทบัตร ราคา และจำนวนคงเหลือ (อยู่ใน EventCard)
// ค้นหาได้จากชื่องานหรือสถานที่
//
// ไม่ต้องรอโหลดแบบหน้าแรก เพราะ RoleGuard ใน app/customer/layout.tsx
// จะแสดงหน้านี้ก็ต่อเมื่ออยู่บน browser และล็อกอินแล้วเท่านั้น

/** เก็บเฉพาะงานที่ชื่อหรือสถานที่มีคำที่พิมพ์ค้นหา (ไม่สนตัวพิมพ์เล็ก/ใหญ่) */
function filterEvents(events: EventItem[], keyword: string) {
  const search = keyword.trim().toLowerCase();

  if (search === "") {
    return events;
  }

  return events.filter((event) => {
    const title = event.title.toLowerCase();
    const location = event.location.toLowerCase();
    return title.includes(search) || location.includes(search);
  });
}

export default function CustomerEventsPage() {
  const [keyword, setKeyword] = useState("");

  // อ่านจาก useStore ตรง ๆ เพราะ listPublishedEvents ใน lib/services/events.ts ยังไม่ได้เขียน
  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");

  const publishedEvents = getPublishedEvents(events);
  const shownEvents = filterEvents(publishedEvents, keyword);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">รายการ Event</h1>
        <p className="mt-1 text-sm text-slate-600">
          งานที่เปิดจำหน่ายบัตรทั้งหมด {publishedEvents.length} งาน
        </p>
      </div>

      <div className="max-w-md">
        <Input
          type="search"
          placeholder="ค้นหาจากชื่องานหรือสถานที่"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* ยังไม่มีงานที่เปิดขายเลย */}
      {publishedEvents.length === 0 && (
        <p className="text-sm text-slate-600">ยังไม่มีงานที่เปิดจำหน่ายบัตร</p>
      )}

      {/* มีงาน แต่ค้นหาแล้วไม่เจอ */}
      {publishedEvents.length > 0 && shownEvents.length === 0 && (
        <p className="text-sm text-slate-600">ไม่พบงานที่ตรงกับ &quot;{keyword}&quot;</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {shownEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            ticketTypes={ticketTypes.filter((ticketType) => ticketType.eventId === event.id)}
          />
        ))}
      </div>
    </div>
  );
}
