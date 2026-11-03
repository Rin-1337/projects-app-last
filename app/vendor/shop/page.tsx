import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: สุรัมภา
export default function VendorShopPage() {
  return (
    <ComingSoon
      title="ข้อมูลร้านค้า"
      owner="นุ่น"
      todo={["แก้ชื่อร้าน / คำอธิบาย / เลขบูท", "แสดงสถานะการอนุมัติร้านจาก Admin"]}
    />
  );
}
