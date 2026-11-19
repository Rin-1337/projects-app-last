"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCategoryWord } from "@/components/customer/common/categories";
import { CustomerShell } from "@/components/customer/common/CustomerShell";
import { EventCard } from "@/components/customer/common/EventCard";
import { Flyer, getEventColor } from "@/components/customer/common/Flyer";
import { formatEventDate } from "@/components/customer/common/formatEventDate";
import { getPublishedEvents } from "@/components/customer/common/getPublishedEvents";
import { CUSTOMER_NAV } from "@/components/customer/common/nav";
import { useIsClient } from "@/components/customer/common/useIsClient";
import { ROLE_HOME, useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";

// หน้าแรก — ผู้รับผิดชอบ: ทิวากร
// หน้าตาแบบ Posh: หัวข้อตัวใหญ่ (เปลี่ยนตามหมวดหมู่ของงานที่เลือก) + แถบใบปิดงาน (กดใบไหนใบนั้นขยาย) + รายการงานทั้งหมด
// หน้านี้สำหรับคนที่ยังไม่ล็อกอินและลูกค้า ทั้งสองกลุ่มเห็นเนื้อหาเหมือนกัน ต่างกันแค่ปุ่มบนแถบด้านบน
// Role อื่นเข้ามาจะถูกพากลับไปหน้าของ Role ตัวเอง

/** เนื้อหาหน้าแรก */
function HomeContent() {
  // อ่านจาก useStore ตรง ๆ เพราะ listPublishedEvents ใน lib/services/events.ts ยังไม่ได้เขียน
  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");
  // id ของงานที่กดเลือกในแถบใบปิด ("" = ยังไม่ได้เลือก ใช้งานแรก)
  const [pickedId, setPickedId] = useState("");

  const publishedEvents = getPublishedEvents(events);

  if (publishedEvents.length === 0) {
    return <p className="px-5 text-base-content/60 sm:px-10">ยังไม่มีงานที่เปิดจำหน่ายบัตร</p>;
  }

  const current = publishedEvents.find((event) => event.id === pickedId) ?? publishedEvents[0];
  const color = getEventColor(current.id);

  // จำนวนคนที่จะไป = บัตรที่ขายไปแล้วของทุกประเภทรวมกัน
  let going = 0;
  for (const ticketType of ticketTypes) {
    if (ticketType.eventId === current.id) {
      going += ticketType.sold;
    }
  }

  return (
    <>
      <h1 className="px-5 text-right text-[72px] leading-none font-normal tracking-[-0.055em] sm:px-10 sm:text-[120px] lg:text-[168px]">
        {getCategoryWord(current.category)}.
      </h1>

      {/* ───── แถบใบปิด (เลื่อนซ้ายขวาได้) กดใบไหนใบนั้นขยาย ───── */}
      <div className="flex items-end gap-3 overflow-x-auto px-5 pt-10 pb-1 sm:px-10">
        {publishedEvents.map((event) => {
          const isActive = event.id === current.id;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => setPickedId(event.id)}
              aria-pressed={isActive}
              aria-label={event.title}
              className={`shrink-0 overflow-hidden rounded-md transition-all duration-300 ${
                isActive ? "h-77.5 w-62" : "h-49 w-39 opacity-90"
              }`}
            >
              <Flyer event={event} size={isActive ? "md" : "sm"} />
            </button>
          );
        })}
      </div>

      <div className="flex max-w-140 flex-col gap-1 px-5 pt-7 sm:px-10">
        <p className="text-[22px] font-medium tracking-[-0.01em]">{current.title}</p>
        <p className="text-[15px] text-base-content/60">
          {formatEventDate(current.startAt)} · {current.location}
        </p>
        <p className="text-[15px] text-base-content/60">{going.toLocaleString()} คนกำลังจะไป</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/customer/events/${current.id}`}
            className="btn px-6.5 text-[15px] font-normal text-white"
            style={{ backgroundColor: color.accent, borderColor: color.accent }}
          >
            ดูงาน
          </Link>
          <Link href="/customer/events" className="btn bg-base-200 px-6.5 text-[15px] font-normal">
            ดูทั้งหมด
          </Link>
        </div>
      </div>

      {/* ───── งานทั้งหมด ───── */}
      <section className="px-5 pt-24 sm:px-10">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[36px] font-normal tracking-[-0.04em] sm:text-[48px]">งานที่เปิดจำหน่ายบัตร</h2>
          <Link href="/customer/events" className="text-[15px] text-base-content/70">
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-5 gap-y-10">
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
    <CustomerShell nav={CUSTOMER_NAV}>
      <div className="pt-2 pb-24">
        {/* ข้อมูลอยู่ใน localStorage ระหว่างรอจึงแสดงกล่องโหลดไปก่อน */}
        {isClient ? <HomeContent /> : <div className="skeleton mx-5 h-72 sm:mx-10" />}
      </div>
    </CustomerShell>
  );
}
