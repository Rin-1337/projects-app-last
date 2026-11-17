import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerOrdersPage() {
  return (
    <ComingSoon
      title="ประวัติรายการ"
      owner="ปอ"
      todo={["ประวัติคำสั่งซื้อเสื้อ/ของที่ระลึก", "สถานะการจัดส่ง + เลขพัสดุ"]}
    />
  );
}
