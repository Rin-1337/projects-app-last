/**
 * ═══════════════════════════════════════════════════════════════════════
 * lib/services/vendors.ts — ร้านค้า บัญชีธนาคาร และรายงานยอดขายร้าน
 * ข้อมูลที่ดูแล: vendors, bankAccounts
 * ═══════════════════════════════════════════════════════════════════════
 *
 * กติกาจากเจ้าของบรีฟ (4 พ.ย.)
 *   - ร้าน 1 ร้าน ขายสินค้า 1 อย่าง ราคาเดียว (Vendor.productName / Vendor.priceToken)
 *   - Admin หาร้านเอง สร้างร้าน และแก้ราคาได้ — ร้านแก้ราคาเองไม่ได้
 *   - ตอนขาย ร้านปรับได้แค่จำนวน แล้วสแกน QR ลูกค้า (= Customer ID) เพื่อหัก Token
 *   - ถอนเงินเหมือนเดิม (ร้านขอ → Admin อนุมัติ → Admin โอนแล้วบันทึก)
 *   - Organizer ดูรายงานยอดขายร้านเพื่อเคลียร์เงินหลังจบงาน
 *
 * ไฟล์นี้แบ่ง 3 ส่วนตามเจ้าของ แก้เฉพาะส่วนของตัวเอง
 *   ใช้ร่วมกัน + ฝั่ง Admin  → เซน
 *   ฝั่ง Vendor             → เซน ทำแทนนุ่น
 *   ฝั่ง Organizer          → เตย
 *   (แก้คนละส่วนของไฟล์ Git รวมให้เองได้ ไม่ชนกัน)
 *
 * ถาม: ทำไมราคาให้ Admin ตั้ง ไม่ให้ร้านตั้งเอง
 * ตอบ: ตามบรีฟ และช่วยเรื่องความปลอดภัย เพราะร้านเป็นคนสแกนหักเงินลูกค้า
 *      ถ้าร้านพิมพ์ราคาเองได้ อาจหักเกิน ระบบนี้ร้านใส่ได้แค่ "จำนวน"
 *      ยอดเงิน = ราคาที่ Admin ตั้ง × จำนวน คำนวณโดยระบบ
 */
import type { BankAccount, ID, TokenTransaction, Vendor } from "../types";
// notImplemented ยังต้องใช้ในส่วนของเตยที่ยังไม่ได้เขียน — ห้ามลบ
import { notImplemented } from "./_todo";
import { generateId, nowISO, readStore, updateStore } from "../storage";
// บันทึกการทำงานของ Admin (สร้างร้าน / แก้ราคา)
import { logAction } from "./audit";
// ใช้เช็กว่าบัญชีที่ Admin เลือกเป็น Vendor จริง
import { getUser, findCustomerByCode } from "./users";
import { pay } from "./wallet";

/* ═══════════════════════ ใช้ร่วมกัน (เซน) ═══════════════════════ */

/**
 * getVendor — หาร้านจาก id
 * คืน: Vendor | undefined
 * ใครเรียก: updateVendor ในไฟล์นี้, sellToCustomer ของนุ่น (หาราคาของร้าน)
 * ท่าเดียวกับ getUser ใน users.ts ต่างแค่ชื่อข้อมูล
 */
export function getVendor(vendorId: ID): Vendor | undefined {
  return readStore("vendors").find((v) => v.id === vendorId);
}

/**
 * listVendors — ร้านทั้งหมด หรือเฉพาะ Event ที่ระบุ
 * ใครเรียก: หน้า /admin/vendors (ไม่ส่ง eventId = ทั้งหมด)
 *           รายงานของเตย (ส่ง eventId = เฉพาะร้านในงานนั้น)
 * ท่าเดียวกับ listUsers ที่กรองด้วย role แต่ตรงนี้กรองด้วย Event
 */
export function listVendors(eventId?: ID): Vendor[] {
  const vendors = readStore("vendors");
  if (!eventId) {
    return vendors;
  }
  return vendors.filter((v) => v.eventId === eventId);
}

/* ═══════════════════════ ฝั่ง Admin (เซน) ═══════════════════════ */

/**
 * checkShopFields — ตรวจข้อมูลร้าน
 * คืน: null = ผ่าน, ข้อความ = เหตุผลที่ไม่ผ่าน
 *
 * ใช้ทั้งตอนสร้างร้าน (createVendor) และตอนแก้ร้าน (updateVendor)
 * → กติกาอยู่ที่เดียว ท่าเดียวกับ validateAccount ใน users.ts (หลัก DRY)
 * ราคาต้องเป็นจำนวนเต็ม > 0 เพราะ 1 Token = 1 บาท ไม่มีเศษสตางค์
 */
function checkShopFields(
  shopName: string,
  productName: string,
  priceToken: number,
): string | null {
  if (!shopName) return "กรุณากรอกชื่อร้าน";
  if (!productName) return "กรุณากรอกชื่อสินค้า";
  if (!Number.isInteger(priceToken) || priceToken <= 0)
    return "ราคาต้องเป็นจำนวนเต็มมากกว่า 0 Token";
  return null;
}

/**
 * createVendor — Admin สร้างร้านให้บัญชี Vendor ที่สร้างไว้แล้ว
 *
 * รับ:  { userId, eventId, shopName, productName, priceToken, boothNo?, adminId }
 * คืน:  { ok: true, vendor } | { ok: false, reason }
 * ใครเรียก: ฟอร์มในหน้า /admin/vendors
 *
 * ลำดับการทำงานของ Admin: สร้างบัญชี Vendor ที่ /admin/users → สร้างร้านที่นี่
 * (แยก "บัญชีผู้ใช้" กับ "ร้าน" เพราะบัญชีคือคนที่ล็อกอิน ร้านคือข้อมูลการขาย)
 *
 * ตรวจ 4 ด่านตามลำดับ
 *   1. บัญชีเป็น Vendor จริง
 *        !user || user.role !== "vendor"  → ไม่เจอบัญชี หรือ เจอแต่ไม่ใช่ Vendor
 *        เขียน !user ไว้ก่อนเสมอ ถ้าสลับ ตอน user เป็น undefined จะ error ทันที
 *   2. บัญชีนี้ยังไม่มีร้าน (1 บัญชี = 1 ร้าน)
 *        เพราะฝั่งนุ่นใช้ getVendorByUser หา "ร้านของคนที่ล็อกอิน" ต้องได้ร้านเดียว
 *   3. Event มีอยู่จริง
 *        อ่าน readStore("events") ตรง ๆ ได้ เพราะเป็นการ "อ่านอย่างเดียว"
 *        กติกาทีมห้ามแค่ "เขียน" ข้อมูลของคนอื่น (events เป็นของเตย)
 *   4. ชื่อร้าน ชื่อสินค้า ราคา ถูกต้อง (checkShopFields)
 *
 * active: true  เปิดขายได้ทันที เพราะ Admin หาร้านเอง ไม่ต้องรออนุมัติ
 * boothNo?.trim() || undefined  ไม่กรอก/กรอกช่องว่าง → ไม่เก็บ
 * บันทึก Audit Log หลังสร้างสำเร็จเท่านั้น
 *
 * ถาม: ทำไมคืน { ok, reason } ไม่ throw
 * ตอบ: เลือกบัญชีผิดหรือกรอกราคาผิดเป็นเรื่องปกติของฟอร์ม ต้องแสดงเหตุผลให้ Admin แก้
 */
export function createVendor(input: {
  userId: ID;
  eventId: ID;
  shopName: string;
  productName: string;
  priceToken: number;
  boothNo?: string;
  adminId: ID;
}): { ok: true; vendor: Vendor } | { ok: false; reason: string } {
  const shopName = input.shopName.trim();
  const productName = input.productName.trim();

  const user = getUser(input.userId);
  if (!user || user.role !== "vendor") {
    return { ok: false, reason: "กรุณาเลือกบัญชีร้านค้า (Vendor)" };
  }
  if (readStore("vendors").some((v) => v.userId === input.userId)) {
    return { ok: false, reason: "บัญชีนี้มีร้านแล้ว" };
  }
  if (!readStore("events").some((e) => e.id === input.eventId)) {
    return { ok: false, reason: "กรุณาเลือก Event" };
  }
  const error = checkShopFields(shopName, productName, input.priceToken);
  if (error) {
    return { ok: false, reason: error };
  }

  const vendor: Vendor = {
    id: generateId("vd"),
    userId: input.userId,
    eventId: input.eventId,
    shopName,
    productName,
    priceToken: input.priceToken,
    boothNo: input.boothNo?.trim() || undefined,
    active: true,
    createdAt: nowISO(),
  };
  updateStore("vendors", (vendors) => [...vendors, vendor]);

  logAction({
    actorId: input.adminId,
    action: "vendor.create",
    targetId: vendor.id,
    detail: `${shopName} · ${productName} ${input.priceToken} Token`,
  });
  return { ok: true, vendor };
}

/**
 * updateVendor — Admin แก้ข้อมูลร้าน / ราคา / เปิด-ปิดร้าน
 *
 * รับ:  vendorId, changes (เฉพาะช่องที่จะแก้), adminId
 * คืน:  ร้านหลังแก้
 * ใครเรียก: ปุ่มแก้ราคา / เปิด-ปิดร้าน ในหน้า /admin/vendors
 * ตัวอย่าง: updateVendor("vd_coffee", { priceToken: 65 }, adminId)   แก้ราคาอย่างเดียว
 *           updateVendor("vd_coffee", { active: false }, adminId)    ปิดร้านชั่วคราว
 *
 * Partial<Pick<Vendor, ...>>
 *   Pick    เลือกเฉพาะช่องที่ Admin แก้ได้ (userId, eventId ไม่อยู่ในนี้ → แก้ไม่ได้)
 *   Partial ทุกช่องไม่บังคับ → ส่งมาแค่ช่องที่อยากแก้
 *
 * ขั้นตอน
 *   1. หาร้าน ไม่เจอ → throw (ปุ่มอยู่ในตารางร้านที่มีอยู่จริง ไม่เจอ = บั๊ก)
 *   2. รวมร้านเดิม + ค่าที่แก้: { ...vendor, ...changes } ช่องที่ไม่ได้ส่งมายังเป็นค่าเดิม
 *      (changes.shopName ?? vendor.shopName).trim() → ส่งชื่อใหม่มาใช้ชื่อใหม่ ไม่งั้นใช้ชื่อเดิม
 *   3. ตรวจ "ผลลัพธ์หลังรวม" ด้วย checkShopFields — ไม่พลาดกรณีส่งราคา 0 มา
 *   4. บันทึก (.map แทนที่เฉพาะร้านนี้)
 *   5. สรุปว่าเปลี่ยนอะไร (notes) แล้วบันทึก Audit Log
 *      เช่น "หมูปิ้งป้าแดง: ราคา 10 → 12 Token" — ใช้ตรวจสอบตอนเคลียร์เงินกับร้าน
 *
 * ถาม: แก้ราคากลางงานแล้ว ยอดที่ขายไปแล้วเปลี่ยนตามไหม
 * ตอบ: ไม่เปลี่ยน ธุรกรรมแต่ละครั้งเก็บ "จำนวน Token ที่หักจริง" ไว้ตอนขาย
 *      ราคาใหม่มีผลเฉพาะการขายครั้งถัดไป และ Audit Log บอกได้ว่าเปลี่ยนราคาเมื่อไหร่
 *
 * ถาม: ทำไมฟังก์ชันนี้ throw แต่ createVendor คืน { ok }
 * ตอบ: ตามหัวฟังก์ชันที่ทีมตกลงไว้ หน้าเว็บจับด้วย try/catch แบบเดียวกับหน้าเติม Token
 */
export function updateVendor(
  vendorId: ID,
  changes: Partial<
    Pick<
      Vendor,
      | "shopName"
      | "productName"
      | "priceToken"
      | "boothNo"
      | "description"
      | "active"
    >
  >,
  adminId: ID,
): Vendor {
  const vendor = getVendor(vendorId);
  if (!vendor) {
    throw new Error("ไม่พบร้านค้า");
  }

  const updated: Vendor = {
    ...vendor,
    ...changes,
    shopName: (changes.shopName ?? vendor.shopName).trim(),
    productName: (changes.productName ?? vendor.productName).trim(),
  };
  const error = checkShopFields(
    updated.shopName,
    updated.productName,
    updated.priceToken,
  );
  if (error) {
    throw new Error(error);
  }

  // === เทียบทั้งค่าและชนิดข้อมูล (ใช้ === เสมอใน TypeScript ไม่ใช้ ==)
  updateStore("vendors", (vendors) =>
    vendors.map((v) => (v.id === vendorId ? updated : v)),
  );

  // สรุปสิ่งที่เปลี่ยน → ข้อความใน Audit Log อ่านแล้วรู้เรื่องทันที
  const notes: string[] = [];
  if (updated.priceToken !== vendor.priceToken) {
    notes.push(`ราคา ${vendor.priceToken} → ${updated.priceToken} Token`);
  }
  if (updated.active !== vendor.active) {
    notes.push(updated.active ? "เปิดร้าน" : "ปิดร้านชั่วคราว");
  }
  if (
    updated.shopName !== vendor.shopName ||
    updated.productName !== vendor.productName ||
    updated.boothNo !== vendor.boothNo ||
    updated.description !== vendor.description
  ) {
    notes.push("แก้ข้อมูลร้าน");
  }
  logAction({
    actorId: adminId,
    action: "vendor.update",
    targetId: vendorId,
    // notes.join(", ") รวมหลายข้อเป็นข้อความเดียว ถ้าไม่มีอะไรเปลี่ยนใช้ข้อความสำรอง
    detail: `${updated.shopName}: ${notes.join(", ") || "ไม่มีการเปลี่ยนแปลง"}`,
  });
  return updated;
}

/* ═══════════════════════ ฝั่ง Vendor (เซนทำแทน นุ่น) ═══════════════════════ */

/**
 * getVendorByUser — หาร้านของบัญชี Vendor ที่ล็อกอินอยู่
 * คืน: Vendor | undefined (undefined = บัญชีนี้ยังไม่มีร้าน)
 * ใครเรียก: ทุกหน้าใน /vendor (หาว่าตัวเองคือร้านไหน)
 * ท่าเดียวกับ getVendor ต่างแค่เทียบ userId แทน id
 */
export function getVendorByUser(userId: ID): Vendor | undefined {
  return readStore("vendors").find((v) => v.userId === userId);
}

/**
 * sellToCustomer — ร้านขายให้ลูกค้า แล้วหัก Token
 *
 * รับ:  { vendorId, customerCode (จาก QR ลูกค้า เช่น "C0001"), quantity }
 * คืน:  { ok: true, tx, customerName, total } หรือ { ok: false, reason }
 * ใครเรียก: หน้า /vendor/receive ตอนกด "ยืนยัน"
 *
 * ลำดับ: ตรวจทุกด่านก่อน → ค่อยเรียก pay() ซึ่งเป็นคนย้าย Token จริง
 * ยอดเงิน = ราคาที่ Admin ตั้ง × จำนวน — ร้านพิมพ์ยอดเงินเองไม่ได้
 */
export function sellToCustomer(input: {
  vendorId: ID;
  customerCode: string;
  quantity: number;
}):
  | { ok: true; tx: TokenTransaction; customerName: string; total: number }
  | { ok: false; reason: string } {
  const { vendorId, customerCode, quantity } = input;

  // 1: ร้านต้องมีอยู่จริง และ Admin ไม่ได้ปิดร้าน
  const vendor = getVendor(vendorId);
  if (!vendor) {
    return { ok: false, reason: "ไม่พบร้านค้า" };
  }
  if (!vendor.active) {
    return { ok: false, reason: "ร้านถูกปิดชั่วคราว ขายไม่ได้" };
  }

  // 2: จำนวนต้องเป็นจำนวนเต็ม 1 ขึ้นไป
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, reason: "จำนวนต้องเป็นจำนวนเต็ม 1 ขึ้นไป" };
  }

  // 3: หาลูกค้าจากรหัสใน QR และบัญชีต้องไม่ถูกระงับ
  const customer = findCustomerByCode(customerCode);
  if (!customer) {
    return { ok: false, reason: `ไม่พบลูกค้ารหัส ${customerCode}` };
  }
  if (customer.status !== "active") {
    return { ok: false, reason: "บัญชีลูกค้าถูกระงับ"};
  }

  // ผ่านทุกด่าน -> ให้ pay() หัก Token (Token ไม่พอ pay จะคืน ok: false ให้เอง)
  const total = vendor.priceToken * quantity;
  const result = pay({
    customerId: customer.id,
    vendorId: vendor.id,
    vendorUserId: vendor.userId,
    amount: total,
    note: `${vendor.productName} ×${quantity}`,
  });
  if (!result.ok) {
    return result;
  }
  return { ok: true, tx: result.tx, customerName: customer.name, total };
}

/**
 * listBankAccounts — บัญชีธนาคารของร้าน (บัญชีหลักอยู่บนสุด)
 * ใครเรียก: หน้า /vendor/bank และ /vendor/withdraw (เลือกบัญชีที่จะรับเงิน)
 *
 * .sort(...)  ตัวที่ isDefault = true ขึ้นก่อน
 */
export function listBankAccounts(vendorId: ID): BankAccount[] {
  return readStore("bankAccounts")
    .filter((b) => b.vendorId === vendorId)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/**
 * saveBankAccount — เพิ่มบัญชีใหม่ หรือแก้บัญชีเดิม
 *
 * รับ:  BankAccount (id ว่าง "" = เพิ่มใหม่ ระบบสร้าง id ให้)
 * คืน:  บัญชีที่บันทึกแล้ว
 * ใครเรียก: หน้า /vendor/bank
 *
 * กติกา: ร้านหนึ่งมีบัญชีหลัก (isDefault) ได้แค่บัญชีเดียว
 *        บัญชีแรกของร้านเป็นบัญชีหลักอัตโนมัติ
 */
export function saveBankAccount(account: BankAccount): BankAccount {
  if (
    !account.bankName.trim() ||
    !account.accountName.trim() ||
    !account.accountNumber.trim()
  ) {
    throw new Error("กรอกชื่อธนาคาร ชื่อบัญชี และเลขบัญชีให้ครบ");
  }

  const isNew = !account.id;
  const hasAccount = listBankAccounts(account.vendorId).length > 0;
  const saved: BankAccount = {
    ...account,
    id: isNew ? generateId("ba") : account.id,
    isDefault: account.isDefault || !hasAccount,
  };

  updateStore("bankAccounts", (accounts) => {
    // ตั้งบัญชีนี้เป็นหลัก > บัญชีอื่นของร้านเดียวกันไม่เป็นหลักแล้ว
    const others = accounts
      .filter((b) => b.id !== saved.id)
      .map((b) =>
        saved.isDefault && b.vendorId === saved.vendorId
          ? { ...b, isDefault: false }
          : b,
      );
    return [...others, saved];
  });
  return saved;
}

/* ═══════════════════════ ฝั่ง Organizer (เตย) ═══════════════════════ */

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
