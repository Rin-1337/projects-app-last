import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: เซน
export default function AdminVendorsPage() {
  return (
    <ComingSoon
      title="จัดการร้านค้า"
      owner="เซน"
      todo={["รายการร้านทั้งหมด: ชื่อร้าน สินค้า ราคาต่อชิ้น Event สถานะ", "สร้างร้าน: เลือกบัญชี Vendor + Event · ตั้งชื่อร้าน สินค้า ราคา (createVendor)", "แก้ราคา / ข้อมูลร้าน / เปิด-ปิดร้าน (updateVendor) — การขายที่ผ่านไปแล้วคิดราคาเดิม"]}
    />
  );
}
