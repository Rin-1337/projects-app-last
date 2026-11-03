import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: อรอนงค์
export default function OrganizerMerchOrdersPage() {
  return (
    <ComingSoon
      title="คำสั่งซื้อออนไลน์"
      owner="ผักบุ้ง"
      todo={["ตรวจสอบคำสั่งซื้อ", "อัปเดตสถานะจัดส่ง + เลขพัสดุ (updateShipping)"]}
    />
  );
}
