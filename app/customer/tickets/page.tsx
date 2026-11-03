import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerTicketsPage() {
  return (
    <ComingSoon
      title="บัตรของฉัน"
      owner="ปอ"
      todo={["ประวัติการซื้อบัตร", "แสดง QR Code ของแต่ละใบสำหรับ Check-in", "สถานะเช็กอินแล้ว/ยัง"]}
    />
  );
}
