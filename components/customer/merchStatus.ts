import type { ShippingStatus } from "@/lib/types";

/**
 * ข้อความและสีของสถานะการจัดส่ง — ผู้รับผิดชอบ: ทิวากร
 * ใช้ร่วมกันระหว่างหน้าประวัติรายการและหน้ารายละเอียดคำสั่งซื้อ
 */
export const SHIPPING_LABEL: Record<ShippingStatus, string> = {
  pending: "รอชำระเงิน",
  preparing: "กำลังเตรียมสินค้า",
  shipped: "ส่งให้ขนส่งแล้ว",
  delivered: "จัดส่งสำเร็จ",
  cancelled: "ยกเลิก",
};

export const SHIPPING_TONE: Record<ShippingStatus, "gray" | "blue" | "green" | "yellow" | "red"> = {
  pending: "yellow",
  preparing: "blue",
  shipped: "blue",
  delivered: "green",
  cancelled: "gray",
};

/** ลำดับขั้นปกติของการจัดส่ง (cancelled ไม่อยู่ในลำดับ) */
export const SHIPPING_STEPS: ShippingStatus[] = ["pending", "preparing", "shipped", "delivered"];
