import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorBankPage() {
  return (
    <ComingSoon
      title="บัญชีธนาคาร"
      owner="เซน"
      todo={["เพิ่ม / แก้ไขบัญชีธนาคาร", "ตั้งบัญชีหลัก"]}
    />
  );
}
