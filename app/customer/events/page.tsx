"use client";

import { useState } from "react";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/components/customer/common/categories";
import { EventCard } from "@/components/customer/common/EventCard";
import { getPublishedEvents } from "@/components/customer/common/getPublishedEvents";
import type { EventCategory, EventItem } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { PAGE_TITLE } from "@/components/customer/common/styles";

// หน้ารายการ Event — ผู้รับผิดชอบ: ทิวากร
// แสดงงานที่เปิดขายทั้งหมด พร้อมประเภทบัตร ราคา และจำนวนคงเหลือ (อยู่ใน EventCard)
// ค้นหาได้จากชื่องานหรือสถานที่ และกรองตามหมวดหมู่ได้
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
  // หมวดหมู่ที่เลือก ("all" = ทุกหมวด รวมงานที่ยังไม่มีหมวดหมู่)
  const [category, setCategory] = useState<EventCategory | "all">("all");

  // อ่านจาก useStore ตรง ๆ เพราะ listPublishedEvents ใน lib/services/events.ts ยังไม่ได้เขียน
  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");

  const publishedEvents = getPublishedEvents(events);
  let shownEvents = filterEvents(publishedEvents, keyword);
  if (category !== "all") {
    shownEvents = shownEvents.filter((event) => event.category === category);
  }

  // ปุ่มหมวดหมู่: "ทั้งหมด" + เฉพาะหมวดที่มีงานอยู่จริง
  const categoryButtons: { value: EventCategory | "all"; label: string }[] = [{ value: "all", label: "ทั้งหมด" }];
  for (const c of CATEGORY_ORDER) {
    if (publishedEvents.some((event) => event.category === c)) {
      categoryButtons.push({ value: c, label: CATEGORY_LABEL[c] });
    }
  }

  return (
    <div className="px-5 pt-6 pb-24 sm:px-10">
      <h1 className={`mb-10 ${PAGE_TITLE}`}>
        อีเวนต์.
      </h1>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex h-13 max-w-130 flex-[1_1_360px] items-center gap-2.5 rounded-full bg-base-200 px-5 focus-within:ring-2 focus-within:ring-base-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="text-base-content/70">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">ค้นหา Event</span>
          <input
            type="search"
            placeholder="ค้นหาจากชื่องานหรือสถานที่"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-base-content/60"
          />
        </label>
        <span className="text-sm text-base-content/60">{shownEvents.length} งาน</span>
      </div>

      {/* ปุ่มกรองหมวดหมู่ */}
      <div role="group" aria-label="หมวดหมู่" className="mb-12 flex flex-wrap gap-2">
        {categoryButtons.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setCategory(item.value)}
            aria-pressed={category === item.value}
            className={`btn h-11 px-5 text-sm font-normal ${category === item.value ? "btn-neutral" : "bg-base-200"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ยังไม่มีงานที่เปิดขายเลย */}
      {publishedEvents.length === 0 && <p className="text-base-content/60">ยังไม่มีงานที่เปิดจำหน่ายบัตร</p>}

      {/* มีงาน แต่ค้นหาแล้วไม่เจอ */}
      {publishedEvents.length > 0 && shownEvents.length === 0 && (
        <p className="text-base-content/60">ไม่พบงานที่ตรงกับเงื่อนไขที่เลือก</p>
      )}

      {/* มือถือ: 3 คอลัมน์ / จอ sm ขึ้นไป: จัดตามความกว้างจอแบบเดิม */}
      <div className="grid grid-cols-3 gap-x-2.5 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-x-5 sm:gap-y-12">
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
