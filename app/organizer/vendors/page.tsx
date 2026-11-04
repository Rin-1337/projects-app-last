import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: เตย
export default function OrganizerVendorsPage() {
  return (
    <ComingSoon
      title="ยอดขายร้านค้า"
      owner="เตย"
      todo={["ตารางทุกร้านใน Event: จำนวนครั้งที่ขาย · Token ที่ได้รับ · ถอนแล้ว · คงค้าง (vendorSalesReport)", "ยอดรวมทั้งงาน", "ใช้เคลียร์เงินกับร้านหลังจบงาน (ดูอย่างเดียว แก้ไม่ได้)"]}
    />
  );
}
