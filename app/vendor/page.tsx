import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorPage() {
  return (
    <ComingSoon
      title="Dashboard ร้านค้า"
      owner="เซน"
      todo={["ยอด Token ที่ได้รับ", "ยอดขายวันนี้ / ทั้งหมด", "สถานะคำขอถอนล่าสุด"]}
    />
  );
}
