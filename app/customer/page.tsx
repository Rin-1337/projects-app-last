import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerPage() {
  return (
    <ComingSoon
      title="หน้าหลักผู้เข้าร่วมงาน"
      owner="ปอ"
      todo={["สรุปบัตรที่มี / ยอด Token / คำสั่งซื้อล่าสุด"]}
    />
  );
}
