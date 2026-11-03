import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: อรอนงค์
export default function OrganizerMerchBoothPage() {
  return (
    <ComingSoon
      title="ขายหน้าบูท"
      owner="ผักบุ้ง"
      todo={["เลือกสินค้า/ไซซ์/จำนวน", "รับเงินสดหรือ QR → ยืนยัน (recordBoothSale)", "ตัดสต็อกทันที"]}
    />
  );
}
