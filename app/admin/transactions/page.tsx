import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminTransactionsPage() {
  return (
    <ComingSoon
      title="ธุรกรรม Token ทั้งหมด"
      owner="นัฐวิ"
      todo={["รายการเติม / จ่าย / ถอน", "กรองตามประเภทและช่วงเวลา"]}
    />
  );
}
