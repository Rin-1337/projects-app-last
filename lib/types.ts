/**
 * lib/types.ts — โครงข้อมูลกลางของทั้งระบบ
 * ผู้ดูแล: นัฐวิ (PM)
 *
 * ⚠️ ไฟล์นี้ทุกคนใช้ร่วมกัน ถ้าต้องการเพิ่ม/แก้ field ให้แจ้งนัฐวิก่อน
 *    แล้วแก้ผ่าน Pull Request เท่านั้น
 *
 * วันที่ทั้งหมดเก็บเป็น ISO string เช่น "2026-12-12T17:00:00+07:00"
 * เงินบาทและ Token เป็นจำนวนเต็ม (1 บาท = 1 Token)
 */

export type ID = string;

/* ───────────── ผู้ใช้และสิทธิ์ ───────────── */

export type Role = "customer" | "organizer" | "vendor" | "admin";

export interface User {
  id: ID;
  role: Role;
  name: string;
  email: string;
  /** Prototype เท่านั้น — เก็บเป็นข้อความธรรมดา */
  password: string;
  phone?: string;
  /** รหัสสมาชิกสำหรับเติม Token หน้างาน เช่น "C0001" (เฉพาะ customer) */
  customerCode?: string;
  status: "active" | "suspended";
  createdAt: string;
}

/** ผู้ใช้ที่ล็อกอินอยู่ (ทิวากรดูแลใน lib/auth.tsx) */
export interface Session {
  userId: ID;
  role: Role;
}

/* ───────────── Event และบัตร (วิริญา) ───────────── */

export type EventStatus = "draft" | "published" | "closed";

export interface EventItem {
  id: ID;
  title: string;
  description: string;
  /** วันเวลาเริ่มงาน */
  startAt: string;
  location: string;
  coverImage?: string;
  /** Organizer ที่ Admin มอบหมาย (null = ยังไม่มีผู้รับผิดชอบ) */
  organizerId: ID | null;
  status: EventStatus;
  createdAt: string;
}

export interface TicketType {
  id: ID;
  eventId: ID;
  name: string;
  price: number;
  quota: number;
  sold: number;
}

export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";

/** การสั่งซื้อบัตร 1 ครั้ง (อาจมีหลายใบ) */
export interface TicketOrder {
  id: ID;
  customerId: ID;
  eventId: ID;
  ticketTypeId: ID;
  quantity: number;
  unitPrice: number;
  total: number;
  attendeeNames: string[];
  paymentMethod: "qr";
  paymentStatus: PaymentStatus;
  createdAt: string;
  paidAt?: string;
}

/** บัตร 1 ใบ = 1 QR สำหรับ Check-in */
export interface Ticket {
  id: ID;
  orderId: ID;
  eventId: ID;
  ticketTypeId: ID;
  customerId: ID;
  attendeeName: string;
  /** ข้อความที่ใช้สร้าง QR เช่น "TICKET:tk_xxx" */
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

/* ───────────── เสื้อและของที่ระลึก (อรอนงค์) ───────────── */

export interface MerchVariant {
  /** เช่น "S", "M", "L" หรือ "FREE" สำหรับสินค้าไม่มีไซซ์ */
  size: string;
  stock: number;
}

export interface MerchProduct {
  id: ID;
  eventId: ID;
  name: string;
  description?: string;
  image?: string;
  price: number;
  variants: MerchVariant[];
  active: boolean;
  createdAt: string;
}

export interface MerchOrderItem {
  productId: ID;
  size: string;
  quantity: number;
  unitPrice: number;
}

export type ShippingStatus =
  | "pending"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface MerchOrder {
  id: ID;
  eventId: ID;
  /** null = ลูกค้า walk-in ที่บูทหน้างาน */
  customerId: ID | null;
  channel: "online" | "booth";
  items: MerchOrderItem[];
  total: number;
  paymentMethod: "qr" | "cash";
  paymentStatus: PaymentStatus;
  /** เฉพาะ channel = "online" */
  shippingAddress?: string;
  shippingStatus?: ShippingStatus;
  trackingNo?: string;
  createdAt: string;
}

/* ───────────── ร้านค้า Vendor ─────────────
 * กติกาจากเจ้าของบรีฟ (4 พ.ย.):
 * - ร้าน 1 ร้าน ขายสินค้า 1 อย่าง ราคาเดียว
 * - Admin หาร้านเอง สร้างร้าน และกำหนด/แก้ราคาได้ (ร้านแก้ราคาเองไม่ได้)
 * - ตอนขาย ร้านปรับได้แค่จำนวน แล้วสแกน QR ของลูกค้าเพื่อหัก Token
 * - Organizer ดูรายงานยอดขายของร้านเพื่อเคลียร์เงินหลังจบงาน
 */

export interface Vendor {
  id: ID;
  /** บัญชีผู้ใช้ role = "vendor" ที่ Admin สร้างให้ */
  userId: ID;
  eventId: ID;
  shopName: string;
  /** สินค้าอย่างเดียวที่ร้านขาย เช่น "หมูปิ้ง" */
  productName: string;
  /** ราคาต่อชิ้นเป็น Token — Admin เป็นคนกำหนด */
  priceToken: number;
  boothNo?: string;
  description?: string;
  /** false = Admin ปิดร้านชั่วคราว ขายไม่ได้ */
  active: boolean;
  createdAt: string;
}

/** สถานะการอนุมัติ (ใช้กับคำขอถอนเงินในอนาคต / ทั่วไป) */
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface BankAccount {
  id: ID;
  vendorId: ID;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
}

export type WithdrawalStatus =
  | "pending" // Vendor ส่งคำขอ
  | "approved" // Admin อนุมัติ รอโอน
  | "rejected" // Admin ปฏิเสธ
  | "transferred"; // Admin บันทึกว่าโอนแล้ว

export interface Withdrawal {
  id: ID;
  vendorId: ID;
  amount: number;
  bankAccountId: ID;
  status: WithdrawalStatus;
  rejectReason?: string;
  /** เลขอ้างอิงการโอนที่ Admin บันทึก */
  transferRef?: string;
  requestedAt: string;
  reviewedBy?: ID;
  reviewedAt?: string;
  transferredAt?: string;
}

/* ───────────── Token Wallet (นัฐวิ) ───────────── */

/** กระเป๋า Token ของ customer และ vendor (key = userId) */
export interface Wallet {
  userId: ID;
  balance: number;
}

export type TokenTxType = "topup" | "payment" | "withdrawal";

export type TopupChannel = "online_qr" | "onsite_cash" | "onsite_qr";

export interface TokenTransaction {
  id: ID;
  type: TokenTxType;
  amount: number;
  /** ผู้จ่าย Token (null สำหรับ topup) */
  fromUserId: ID | null;
  /** ผู้รับ Token (null สำหรับ withdrawal) */
  toUserId: ID | null;
  /** เฉพาะ payment / withdrawal */
  vendorId?: ID;
  /** เฉพาะ topup */
  channel?: TopupChannel;
  /** เฉพาะ withdrawal */
  withdrawalId?: ID;
  /** Admin ที่ทำรายการ (เติมหน้างาน / อนุมัติถอน) */
  performedBy?: ID;
  note?: string;
  createdAt: string;
}

/* ───────────── Audit Log (นัฐวิ) ───────────── */

export interface AuditLog {
  id: ID;
  actorId: ID;
  /** เช่น "user.create", "wallet.topup", "withdrawal.approve" */
  action: string;
  targetId?: ID;
  detail?: string;
  createdAt: string;
}
