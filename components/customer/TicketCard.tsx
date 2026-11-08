import { Badge, Button, Card } from "@/components/ui";
import type { Ticket } from "@/lib/types";

/** บัตร 1 ใบ: ชื่อผู้เข้าร่วม ประเภทบัตร สถานะเช็กอิน และปุ่มเปิด QR */
export function TicketCard({
  ticket,
  ticketTypeName,
  onShowQR,
}: {
  ticket: Ticket;
  ticketTypeName: string;
  onShowQR: () => void;
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="font-semibold text-slate-900">{ticket.attendeeName}</p>
        <p className="text-sm text-slate-600">บัตร {ticketTypeName}</p>
        <div className="mt-2">
          {ticket.checkedIn ? (
            <Badge tone="green">เช็กอินแล้ว</Badge>
          ) : (
            <Badge tone="yellow">ยังไม่เช็กอิน</Badge>
          )}
        </div>
      </div>

      <Button variant="secondary" size="sm" onClick={onShowQR}>
        แสดง QR
      </Button>
    </Card>
  );
}
