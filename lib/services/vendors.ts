/**
 * lib/services/vendors.ts — ร้านค้า บัญชีธนาคาร และรายงานยอดขายร้าน
 * ข้อมูลที่ดูแล: vendors, bankAccounts
 *
 * กติกาจากเจ้าของบรีฟ (4 พ.ย.):
 * - ร้าน 1 ร้าน ขายสินค้า 1 อย่าง ราคาเดียว (Vendor.productName / Vendor.priceToken)
 * - Admin หาร้านเอง สร้างร้าน และแก้ราคาได้ — ร้านแก้ราคาเองไม่ได้
 * - ตอนขาย ร้านปรับได้แค่จำนวน แล้วสแกน QR ลูกค้า (= Customer ID) เพื่อหัก Token
 * - Organizer ดูรายงานยอดขายร้านเพื่อเคลียร์เงินหลังจบงาน
 *
 * ไฟล์นี้แบ่ง 3 ส่วนตามเจ้าของ แก้เฉพาะส่วนของตัวเอง:
 *   ฝั่ง Admin      → เซน
 *   ฝั่ง Vendor     → นุ่น
 *   ฝั่ง Organizer  → เตย
 */
import type { BankAccount, ID, TokenTransaction, Vendor } from "../types";
import { notImplemented } from "./_todo";

/* ───────────── ใช้ร่วมกัน ───────────── */

export function getVendor(vendorId: ID): Vendor | undefined {
  void vendorId;
  return notImplemented("getVendor");
}

/** ร้านทั้งหมด หรือเฉพาะ Event ที่ระบุ */
export function listVendors(eventId?: ID): Vendor[] {
  void eventId;
  return notImplemented("listVendors");
}

/* ───────────── ฝั่ง Admin (เซน) ───────────── */

/** Admin สร้างร้านให้บัญชี Vendor ที่สร้างไว้แล้ว (ร้านเปิดขายได้ทันที ไม่มีขั้นอนุมัติ) */
export function createVendor(input: {
  userId: ID;
  eventId: ID;
  shopName: string;
  productName: string;
  priceToken: number;
  boothNo?: string;
  adminId: ID;
}): { ok: true; vendor: Vendor } | { ok: false; reason: string } {
  void input;
  return notImplemented("createVendor");
}

/** Admin แก้ข้อมูลร้าน / ราคา / เปิด-ปิดร้าน — การขายที่เกิดไปแล้วยังคิดราคาเดิม */
export function updateVendor(
  vendorId: ID,
  changes: Partial<
    Pick<Vendor, "shopName" | "productName" | "priceToken" | "boothNo" | "description" | "active">
  >,
  adminId: ID,
): Vendor {
  void vendorId;
  void changes;
  void adminId;
  return notImplemented("updateVendor");
}

/* ───────────── ฝั่ง Vendor (นุ่น) ───────────── */

/** ร้านของบัญชีที่ล็อกอินอยู่ */
export function getVendorByUser(userId: ID): Vendor | undefined {
  void userId;
  return notImplemented("getVendorByUser");
}

/**
 * ร้านขายให้ลูกค้า: ราคา = vendor.priceToken × quantity
 * 1. หาลูกค้าจาก customerCode (QR ของลูกค้า) ด้วย findCustomerByCode() ใน users.ts
 * 2. เรียก pay() ใน wallet.ts — ยอดไม่พอจะไม่หักอะไร
 * 3. ใส่ note เช่น "หมูปิ้ง ×10" ให้ลูกค้าเห็นในประวัติ
 */
export function sellToCustomer(input: {
  vendorId: ID;
  customerCode: string;
  quantity: number;
}):
  | { ok: true; tx: TokenTransaction; customerName: string; total: number }
  | { ok: false; reason: string } {
  void input;
  return notImplemented("sellToCustomer");
}

export function listBankAccounts(vendorId: ID): BankAccount[] {
  void vendorId;
  return notImplemented("listBankAccounts");
}

export function saveBankAccount(account: BankAccount): BankAccount {
  void account;
  return notImplemented("saveBankAccount");
}

/* ───────────── ฝั่ง Organizer (เตย) ───────────── */

export interface VendorSalesRow {
  vendor: Vendor;
  /** จำนวนครั้งที่ขาย */
  salesCount: number;
  /** Token ที่ร้านได้รับทั้งหมด */
  totalReceived: number;
  /** Token ที่ถอนเป็นเงินไปแล้ว (Admin โอนแล้ว) */
  totalWithdrawn: number;
  /** ยอดที่ยังต้องเคลียร์กับร้าน = รับ − ถอน */
  outstanding: number;
}

/** รายงานยอดขายของทุกร้านใน Event — ใช้เคลียร์เงินกับร้านหลังจบงาน */
export function vendorSalesReport(eventId: ID): VendorSalesRow[] {
  void eventId;
  return notImplemented("vendorSalesReport");
}
