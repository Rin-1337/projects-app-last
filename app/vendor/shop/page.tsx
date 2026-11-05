import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorShopPage() {
  return (
    <ComingSoon
      title="ข้อมูลร้าน"
      owner="เซน"
      todo={["แสดงชื่อร้าน สินค้า ราคาต่อชิ้น เลขบูท (ดูอย่างเดียว — Admin เป็นคนแก้)", "แสดงสถานะร้าน เปิดขาย / ปิดชั่วคราว"]}
    />
  );
}
