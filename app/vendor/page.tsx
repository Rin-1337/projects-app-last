import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: สุรัมภา
export default function VendorPage() {
  return (
    <ComingSoon
      title="Dashboard ร้านค้า"
      owner="นุ่น"
      todo={["ยอด Token ที่ได้รับ", "ยอดขายวันนี้ / ทั้งหมด", "สถานะคำขอถอนล่าสุด"]}
    />
  );
}
