import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerEventsDetailPage() {
  return (
    <ComingSoon
      title="รายละเอียด Event + ซื้อบัตร"
      owner="ปอ"
      todo={["เลือกประเภทบัตรและจำนวน", "กรอกชื่อผู้เข้าร่วมงาน", "แสดง QR ชำระเงิน → จำลองชำระสำเร็จ (createTicketOrder / confirmTicketPayment)"]}
    />
  );
}
