import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminWithdrawalsPage() {
  return (
    <ComingSoon
      title="คำขอถอนเงิน"
      owner="นัฐวิ"
      todo={["รายการคำขอ + ยอด Token ของร้าน", "อนุมัติ / ปฏิเสธพร้อมเหตุผล", "บันทึกผลการโอน (markTransferred → recordWithdrawal)"]}
    />
  );
}
