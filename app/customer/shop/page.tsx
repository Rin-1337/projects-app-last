import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerShopPage() {
  return (
    <ComingSoon
      title="เสื้อและของที่ระลึก"
      owner="ปอ"
      todo={["รายการสินค้า (listActiveProducts) — ใช้ component จากอรอนงค์ได้", "เลือกไซซ์/จำนวน + ที่อยู่จัดส่ง", "ชำระด้วย QR (createOnlineOrder)"]}
    />
  );
}
