"use client";

import { EventBanner } from "@/components/customer/EventBanner";
import { EventCard } from "@/components/customer/EventCard";
import { HomeHeader } from "@/components/customer/HomeHeader";
import { useIsClient } from "@/components/customer/useIsClient";
import type { EventItem } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้าแรก — ผู้รับผิดชอบ: ทิวากร
// ทุกคนเข้าหน้านี้ได้ ไม่ต้องล็อกอิน และเห็นเนื้อหาเหมือนกัน ต่างกันแค่ปุ่มบนแถบด้านบน

/** เลือกเฉพาะงานที่เปิดขาย แล้วเรียงจากงานที่จะถึงก่อน */
function getPublishedEvents(events: EventItem[]) {
  const publishedEvents = events.filter((event) => event.status === "published");

  return publishedEvents.sort((a, b) => {
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });
}

/** เนื้อหาหน้าแรก: แบนเนอร์งานถัดไป + รายการงานทั้งหมด */
function HomeContent() {
  // อ่านจาก useStore ตรง ๆ เพราะ listPublishedEvents ใน lib/services/events.ts ยังไม่ได้เขียน
  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");

  const publishedEvents = getPublishedEvents(events);

  if (publishedEvents.length === 0) {
    return <p className="text-sm text-slate-600">ยังไม่มีงานที่เปิดจำหน่ายบัตร</p>;
  }

  return (
    <>
      <EventBanner event={publishedEvents[0]} />

      <section>
        <h2 className="text-xl font-bold text-slate-900">งานที่เปิดจำหน่ายบัตร</h2>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {publishedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              ticketTypes={ticketTypes.filter((ticketType) => ticketType.eventId === event.id)}
            />
          ))}
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  const isClient = useIsClient();

  return (
    <div className="min-h-full">
      <HomeHeader />

      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6">
        {/* ข้อมูลอยู่ใน localStorage ระหว่างรอจึงแสดงกล่องโหลดไปก่อน */}
        {isClient ? (
          <HomeContent />
        ) : (
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        )}
      </main>
    </div>
  );
}
