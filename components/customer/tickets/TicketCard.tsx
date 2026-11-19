import type { Ticket } from "@/lib/types";

/** บัตร 1 ใบ: ชื่อผู้เข้าร่วม ประเภทบัตร สถานะเช็กอิน และปุ่มเปิด QR (ใช้บนพื้นดำ theme posh-dark) */
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
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-base-200 px-5 py-4.5">
      <div className="flex min-w-45 flex-1 flex-col gap-0.5">
        <p className="text-[17px]">{ticket.attendeeName}</p>
        <p className="text-sm text-base-content/60">บัตร {ticketTypeName}</p>
      </div>

      {ticket.checkedIn ? (
        <span className="rounded-full bg-[#12301F] px-3 py-1.5 text-[13px] leading-none text-[#6EE7B7]">เช็กอินแล้ว</span>
      ) : (
        <span className="rounded-full bg-[#33290A] px-3 py-1.5 text-[13px] leading-none text-[#FCD34D]">ยังไม่เช็กอิน</span>
      )}

      <button type="button" className="btn btn-neutral h-11 font-normal" onClick={onShowQR}>
        แสดง QR
      </button>
    </div>
  );
}
