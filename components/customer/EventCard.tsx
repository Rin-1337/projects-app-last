import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { EventItem, TicketType } from "@/lib/types";
import { formatEventDate } from "./formatEventDate";

/** บัตร 1 ประเภท: ชื่อ จำนวนคงเหลือ ราคา */
function TicketRow({ ticketType }: { ticketType: TicketType }) {
  const remaining = ticketType.quota - ticketType.sold;
  const isSoldOut = remaining <= 0;

  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="font-medium text-slate-800">{ticketType.name}</span>

      <span className="flex items-center gap-3">
        {isSoldOut ? (
          <Badge tone="red">บัตรหมด</Badge>
        ) : (
          <span className="text-slate-500">เหลือ {remaining.toLocaleString()} ใบ</span>
        )}
        <span className="font-semibold text-slate-900">
          {ticketType.price.toLocaleString()} บาท
        </span>
      </span>
    </li>
  );
}

/** การ์ดงาน 1 งาน พร้อมรายการบัตร */
export function EventCard({
  event,
  ticketTypes,
}: {
  event: EventItem;
  ticketTypes: TicketType[];
}) {
  return (
    <Card className="flex h-full flex-col">
      <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{formatEventDate(event.startAt)}</p>
      <p className="text-sm text-slate-600">{event.location}</p>

      <ul className="mt-4 flex-1 divide-y divide-slate-100 border-y border-slate-100">
        {ticketTypes.map((ticketType) => (
          <TicketRow key={ticketType.id} ticketType={ticketType} />
        ))}

        {ticketTypes.length === 0 && (
          <li className="py-2 text-sm text-slate-500">ยังไม่เปิดจำหน่ายบัตร</li>
        )}
      </ul>

      <Link
        href={`/customer/events/${event.id}`}
        className="mt-4 text-sm font-medium text-blue-700 hover:underline"
      >
        ดูรายละเอียด
      </Link>
    </Card>
  );
}
