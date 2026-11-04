import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ปอ
export default function CustomerPayPage() {
  return (
    <ComingSoon
      title="QR ของฉัน (จ่ายร้านค้า)"
      owner="ปอ"
      todo={["แสดง QR จาก Customer ID ของลูกค้า (เช่น C0001) ให้ร้านสแกน", "แสดง Customer ID เป็นตัวหนังสือใต้ QR (เผื่อร้านพิมพ์แทน)", "แสดงยอด Token คงเหลือ", "รายการจ่ายร้านค้าล่าสุด (listTransactions) เช่น หมูปิ้ง ×10 · 100 Token"]}
    />
  );
}
