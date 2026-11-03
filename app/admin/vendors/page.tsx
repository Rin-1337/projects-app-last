import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminVendorsPage() {
  return (
    <ComingSoon
      title="อนุมัติร้านค้า"
      owner="นัฐวิ"
      todo={["รายการร้านที่รออนุมัติ", "อนุมัติ / ปฏิเสธร้าน (setVendorApproval)"]}
    />
  );
}
