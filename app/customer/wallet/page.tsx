import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerWalletPage() {
  return (
    <ComingSoon
      title="Token Wallet"
      owner="ปอ"
      todo={["ยอด Token คงเหลือ + Customer ID", "เติม Token ผ่าน QR (topupOnline)", "ประวัติการเติมและใช้ Token"]}
    />
  );
}
