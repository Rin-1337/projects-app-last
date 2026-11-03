import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: สุรัมภา
export default function VendorProductsPage() {
  return (
    <ComingSoon
      title="สินค้าของร้าน"
      owner="นุ่น"
      todo={["เพิ่ม / แก้ไข / ลบสินค้า (ราคาเป็น Token)", "ส่งให้ Organizer อนุมัติ", "แสดงสถานะ pending / approved / rejected + เหตุผล"]}
    />
  );
}
