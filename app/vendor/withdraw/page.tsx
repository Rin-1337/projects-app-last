import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorWithdrawPage() {
  return (
    <ComingSoon
      title="ถอนเงิน"
      owner="เซน"
      todo={["ระบุจำนวน + เลือกบัญชี (requestWithdrawal)", "สถานะคำขอ + ประวัติการถอน"]}
    />
  );
}
