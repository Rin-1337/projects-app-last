/**
 * ชื่อภาษาไทยของ action ใน Audit Log + หมวด + สีป้าย
 * ใช้ร่วมกันที่หน้า /admin/audit-logs และ "กิจกรรมล่าสุด" ใน Dashboard
 * ผู้รับผิดชอบ: นัฐวิ
 */
import type { Role } from "@/lib/types";

export const ACTION_LABEL: Record<string, string> = {
  // เข้าสู่ระบบ / บัญชีของตัวเอง
  "auth.login": "เข้าสู่ระบบ",
  "auth.logout": "ออกจากระบบ",
  "auth.login_failed": "เข้าสู่ระบบไม่สำเร็จ",
  "auth.register": "สมัครสมาชิก",
  "auth.profile": "แก้ไขโปรไฟล์",
  "auth.password": "เปลี่ยนรหัสผ่าน",
  // Admin จัดการบัญชี
  "user.create": "สร้างบัญชี",
  "user.suspend": "ระงับบัญชี",
  "user.activate": "เปิดใช้บัญชี",
  // Token
  "wallet.topup": "เติม Token หน้างาน",
  "wallet.topup_online": "เติม Token ออนไลน์",
  // บัตร / Event
  "ticket.purchase": "ซื้อบัตร",
  "ticket.checkin": "เช็กอิน",
  "ticket.cancel": "ยกเลิกคำสั่งซื้อบัตร",
  "event.create": "สร้าง Event",
  "event.update": "แก้ไข Event",
  "event.ticket_type": "ประเภทบัตร",
  "event.assign": "กำหนด Organizer",
  // ของที่ระลึก
  "merch.product": "จัดการสินค้า",
  "merch.purchase": "ซื้อของที่ระลึก",
  "merch.booth_sale": "ขายหน้าบูธ",
  "merch.shipping": "อัปเดตการจัดส่ง",
  // ร้านค้า
  "vendor.create": "สร้างร้าน",
  "vendor.update": "แก้ไขร้าน",
  "vendor.sale": "ร้านขายสินค้า",
  "vendor.bank": "บัญชีธนาคาร",
  // ถอนเงิน
  "withdrawal.request": "ขอถอนเงิน",
  "withdrawal.approve": "อนุมัติถอนเงิน",
  "withdrawal.reject": "ไม่อนุมัติถอนเงิน",
  "withdrawal.transfer": "บันทึกการโอน",
};

// หมวด = คำหน้าจุดของ action เช่น "auth.login" → "auth"
export const GROUPS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "auth", label: "เข้าสู่ระบบ" },
  { key: "user", label: "จัดการบัญชี" },
  { key: "wallet", label: "เติม Token" },
  { key: "ticket", label: "บัตร / เช็กอิน" },
  { key: "event", label: "Event" },
  { key: "merch", label: "ของที่ระลึก" },
  { key: "vendor", label: "ร้านค้า" },
  { key: "withdrawal", label: "ถอนเงิน" },
];

type Tone = "gray" | "blue" | "green" | "yellow" | "red";

/** สีป้ายของแต่ละ action: ไม่สำเร็จ/ระงับ/ปฏิเสธ = แดง, เงินเข้า-ขายได้ = เขียว, งานรอทำ = เหลือง */
export function actionTone(action: string): Tone {
  if (action === "auth.login_failed" || action === "user.suspend" || action === "withdrawal.reject" || action === "ticket.cancel") return "red";
  if (action.startsWith("wallet.") || action.endsWith("purchase") || action.endsWith("sale")) return "green";
  if (action === "withdrawal.request") return "yellow";
  if (action.startsWith("auth.")) return "gray";
  return "blue";
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  organizer: "Organizer",
  vendor: "ร้านค้า",
  customer: "ลูกค้า",
};
