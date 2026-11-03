import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminTopupPage() {
  return (
    <ComingSoon
      title="เติม Token หน้างาน"
      owner="นัฐวิ"
      todo={["ค้นหาด้วย Customer ID (findCustomerByCode)", "แสดงข้อมูลสมาชิกเพื่อยืนยันตัวตน", "ระบุยอด + ช่องทาง เงินสด/QR → ยืนยัน (topupOnsite)"]}
    />
  );
}
