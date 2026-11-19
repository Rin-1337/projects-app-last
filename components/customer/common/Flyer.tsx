import Image from "next/image";
import type { EventCategory, EventItem } from "@/lib/types";

/**
 * ใบปิดงาน 1 ใบ (แบบ Posh) — ใช้ในหน้าแรก, รายการ Event, รายละเอียดงาน และบัตรของฉัน
 * ขยายเต็มกล่องที่ครอบอยู่ ให้คนเรียกใช้กำหนดขนาด/สัดส่วนเอง เช่น
 *   <div className="aspect-square overflow-hidden rounded-md"><Flyer event={event} /></div>
 *
 *   มีรูปปก (event.coverImage) → แสดงรูป
 *   ไม่มีรูปปก → พื้นสีประจำงาน + ชื่องานตัวใหญ่ + วันที่
 */

/**
 * สีประจำงาน แยกตามหมวดหมู่ (งานหมวดเดียวกันได้สีเดียวกัน)
 *   bg = พื้นใบปิด, ink = ตัวหนังสือบนใบปิด, accent = สีปุ่มหลักของงาน (ตัวหนังสือขาว)
 */
const CATEGORY_COLOR: Record<EventCategory, { bg: string; ink: string; accent: string }> = {
  music: { bg: "#2B1745", ink: "#F0ABFC", accent: "#7C3AED" }, // ม่วง
  party: { bg: "#111111", ink: "#FFD84D", accent: "#8A6420" }, // ดำ-เหลือง
  food: { bg: "#FF6B2C", ink: "#1A0A00", accent: "#B4460C" }, // ส้ม
  sport: { bg: "#C8F169", ink: "#14301A", accent: "#3F6B12" }, // เขียว
  tech: { bg: "#DCEBFF", ink: "#0B3B66", accent: "#1D5FA8" }, // ฟ้า
  workshop: { bg: "#F1E9DE", ink: "#2E2A26", accent: "#5B4636" }, // ครีม
};

/** สีของงาน: ดูจากหมวดหมู่ (ทุกงานต้องมีหมวดหมู่ Organizer บังคับเลือกตอนสร้าง) */
export function getEventColor(event: EventItem) {
  return CATEGORY_COLOR[event.category];
}

/** ขนาดตัวหนังสือและระยะขอบของใบปิดแต่ละขนาด (ตัวเลขตามไฟล์ design) */
const SIZES = {
  xs: { title: "text-[11px]", padding: "p-2" }, // ใบเล็กมาก (บัตรของฉัน)
  sm: { title: "text-[26px]", padding: "p-4" }, // ใบเล็กในแถบหน้าแรก
  md: { title: "text-[44px]", padding: "p-4" }, // ใบที่เลือกในแถบหน้าแรก
  lg: { title: "text-[52px]", padding: "p-5" }, // การ์ดงาน
  xl: { title: "text-[56px] sm:text-[96px]", padding: "p-8" }, // หน้ารายละเอียดงาน
};

export function Flyer({ event, size = "lg" }: { event: EventItem; size?: keyof typeof SIZES }) {
  if (event.coverImage) {
    return (
      <div className="relative h-full w-full">
        {/* unoptimized = ใช้รูปตามที่กรอกมาเลย เพราะไม่รู้ล่วงหน้าว่ารูปอยู่เว็บไหน */}
        <Image src={event.coverImage} alt={`ใบปิดงาน ${event.title}`} fill unoptimized className="object-cover" />
      </div>
    );
  }

  const color = getEventColor(event);
  const date = new Date(event.startAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div
      role="img"
      aria-label={`ใบปิดงาน ${event.title}`}
      className={`flex h-full w-full flex-col justify-between text-left ${SIZES[size].padding}`}
      style={{ backgroundColor: color.bg, color: color.ink }}
    >
      {size !== "xs" && <span className="text-[10px] font-medium tracking-[0.12em]">EVENTHUB</span>}
      <span className={`line-clamp-4 leading-[0.92] font-semibold tracking-[-0.04em] ${SIZES[size].title}`}>
        {event.title}
      </span>
      {size !== "xs" && <span className="text-[11px] font-medium">{date}</span>}
    </div>
  );
}
