import Link from "next/link";
import type { EventItem, TicketType } from "@/lib/types";
import { Flyer } from "./Flyer";
import { formatEventDate } from "./formatEventDate";

/**
 * การ์ดงาน 1 งาน (แบบ Posh): ใบปิดสี่เหลี่ยมจัตุรัส + ชื่องาน วันที่ สถานที่ ราคาเริ่มต้น
 * บัตรหมดทุกประเภท = มีป้าย "บัตรหมด" ซ้อนมุมขวาบนของใบปิด
 * (ราคาบัตรแต่ละประเภทดูได้ในหน้ารายละเอียดงาน)
 */
export function EventCard({ event, ticketTypes }: { event: EventItem; ticketTypes: TicketType[] }) {
  // ราคาถูกสุดของบัตรที่ยังเหลือ
  const available = ticketTypes.filter((ticketType) => ticketType.quota - ticketType.sold > 0);
  const isSoldOut = ticketTypes.length > 0 && available.length === 0;

  let priceLabel = "ยังไม่เปิดจำหน่ายบัตร";
  if (available.length > 0) {
    const lowest = Math.min(...available.map((ticketType) => ticketType.price));
    priceLabel = `เริ่ม ${lowest.toLocaleString()} บาท`;
  } else if (isSoldOut) {
    priceLabel = "บัตรหมด";
  }

  return (
    // มือถือการ์ดเรียง 3 คอลัมน์ (การ์ดเล็ก) จึงใช้ตัวหนังสือเล็กลง — จอ sm ขึ้นไปใช้ขนาดเดิม
    <Link href={`/customer/events/${event.id}`} className="group flex flex-col gap-2 sm:gap-3.5">
      <div className="relative aspect-square overflow-hidden rounded-md">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
          <Flyer event={event} size="lg" />
        </div>
        {isSoldOut && (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-[#B42318] sm:top-3.5 sm:right-3.5 sm:px-3 sm:py-1.5 sm:text-[13px]">
            บัตรหมด
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium sm:text-[17px]">{event.title}</span>
        <span className="text-[11px] text-base-content/60 sm:text-sm">{formatEventDate(event.startAt)}</span>
        <span className="text-[11px] text-base-content/60 sm:text-sm">{event.location}</span>
        <span className="mt-1 text-[11px] sm:mt-1.5 sm:text-sm">{priceLabel}</span>
      </div>
    </Link>
  );
}
