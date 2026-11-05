import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerWalletPage() {
  return (
    <ComingSoon
      title="Token Wallet"
      owner="ปอ"
      todo={["ยอด Token คงเหลือ + Customer ID", "เติม Token ผ่าน QR (topupOnline)", "จ่ายร้านค้า: แสดง QR จาก Customer ID ของลูกค้า (เช่น C0001) ให้ร้านสแกน", "แสดง Customer ID เป็นตัวหนังสือใต้ QR (เผื่อร้านพิมพ์แทน)", "ประวัติการเติมและใช้ Token รวมรายการจ่ายร้านค้าล่าสุด (listTransactions) เช่น หมูปิ้ง ×10 · 100 Token"]}
    />
  );
}
