import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: สุรัมภา
export default function VendorWithdrawPage() {
  return (
    <ComingSoon
      title="ถอนเงิน"
      owner="นุ่น"
      todo={["ระบุจำนวน + เลือกบัญชี (requestWithdrawal)", "สถานะคำขอ + ประวัติการถอน"]}
    />
  );
}
