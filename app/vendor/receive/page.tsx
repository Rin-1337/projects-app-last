import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorReceivePage() {
  return (
    <ComingSoon
      title="ขายสินค้า / รับ Token"
      owner="เซน"
      todo={["แสดงสินค้าและราคาต่อชิ้นของร้าน (Admin ตั้ง ร้านแก้ไม่ได้)", "ปุ่ม + / − หรือช่องกรอกจำนวน → แสดงยอดรวม = ราคา × จำนวน", "สแกน QR ลูกค้า (ช่วงแรกให้พิมพ์ Customer ID แทน)", "แสดงชื่อลูกค้า + ยอดรวม ให้ร้านเช็กก่อนกดยืนยัน", "ยืนยัน → sellToCustomer() · ยอดไม่พอให้แสดงเหตุผล", "รายการขายล่าสุด"]}
    />
  );
}
