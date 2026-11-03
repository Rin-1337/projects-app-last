import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerPayPage() {
  return (
    <ComingSoon
      title="จ่ายร้านค้าด้วย Token"
      owner="ปอ"
      todo={["สแกน/กรอกรหัส QR ร้าน (getVendorByQr)", "ระบุยอด Token → ยืนยัน (pay)", "แสดงผลสำเร็จ/ยอดไม่พอ"]}
    />
  );
}
