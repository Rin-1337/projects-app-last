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
    <Link href={`/customer/events/${event.id}`} className="group flex flex-col gap-3.5">
      <div className="relative aspect-square overflow-hidden rounded-md">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
          <Flyer event={event} size="lg" />
        </div>
        {isSoldOut && (
          <span className="absolute top-3.5 right-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-[#B42318]">
            บัตรหมด
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[17px] font-medium">{event.title}</span>
        <span className="text-sm text-base-content/60">{formatEventDate(event.startAt)}</span>
        <span className="text-sm text-base-content/60">{event.location}</span>
        <span className="mt-1.5 text-sm">{priceLabel}</span>
      </div>
    </Link>
  );
}
