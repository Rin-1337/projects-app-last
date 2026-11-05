"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EventBanner } from "@/components/customer/EventBanner";
import { EventCard } from "@/components/customer/EventCard";
import { HomeHeader } from "@/components/customer/HomeHeader";
import { useIsClient } from "@/components/customer/useIsClient";
import { ROLE_HOME, useAuth } from "@/lib/auth";
import type { EventItem } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้าแรก — ผู้รับผิดชอบ: ทิวากร
// หน้านี้สำหรับคนที่ยังไม่ล็อกอินและลูกค้า ทั้งสองกลุ่มเห็นเนื้อหาเหมือนกัน ต่างกันแค่ปุ่มบนแถบด้านบน
// Role อื่นเข้ามาจะถูกพากลับไปหน้าของ Role ตัวเอง

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
  const router = useRouter();
  const { user } = useAuth();
  const isClient = useIsClient();

  const isOtherRole = user !== null && user.role !== "customer";

  useEffect(() => {
    if (user !== null && user.role !== "customer") {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, router]);

  // ไม่แสดงหน้าแรกระหว่างรอย้ายหน้า จะได้ไม่เห็นเนื้อหาแวบหนึ่ง
  if (isOtherRole) {
    return <p className="p-10 text-center text-sm text-slate-500">กำลังพาไปหน้าของคุณ...</p>;
  }

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
