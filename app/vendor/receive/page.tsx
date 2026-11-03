import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: สุรัมภา
export default function VendorReceivePage() {
  return (
    <ComingSoon
      title="QR รับชำระ"
      owner="นุ่น"
      todo={["แสดง QR Code ของร้าน (vendor.qrCode)", "แสดงรายการที่เพิ่งได้รับ"]}
    />
  );
}
