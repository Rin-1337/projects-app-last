import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: วิริญา
export default function OrganizerVendorsPage() {
  return (
    <ComingSoon
      title="ร้านค้าในงาน"
      owner="เตย"
      todo={["รายการร้าน Vendor ใน Event", "อนุมัติ/ปฏิเสธสินค้า Vendor พร้อมเหตุผล (reviewVendorProduct)", "ภาพรวมยอดขาย Token ของแต่ละร้าน"]}
    />
  );
}
