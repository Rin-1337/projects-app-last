/**
 * ═══════════════════════════════════════════════════════════════════════
 * lib/services/wallet.ts — ระบบ Token Wallet (กระเป๋า Token)
 * เจ้าของ: นัฐวิ (เซน) · Admin
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ไฟล์นี้ทำอะไร
 *   จัดการ "เงิน" ทั้งหมดของระบบในรูปของ Token (1 บาท = 1 Token)
 *   - เติม Token (ลูกค้าเติมเองออนไลน์ / Admin เติมหน้างาน)
 *   - จ่าย Token (ลูกค้า → ร้านค้า)
 *   - ถอน Token (ร้านค้า → เงินบาท เมื่อ Admin โอนแล้ว)
 *   - ดูยอดและประวัติ
 *
 * ข้อมูลที่ไฟล์นี้ดูแล (เก็บใน localStorage ผ่าน lib/storage.ts)
 *   wallets            [{ userId, balance }]           ยอดคงเหลือของแต่ละคน
 *   tokenTransactions  [{ id, type, amount, from, to, ... }]  ประวัติทุกครั้งที่ยอดเปลี่ยน
 *
 * ใครเรียกใช้ไฟล์นี้
 *   หน้า /admin/topup              → topupOnsite()
 *   หน้า /customer/wallet  (ปอ)    → getBalance(), topupOnline(), listTransactions()
 *   vendors.ts sellToCustomer (นุ่น) → pay()
 *   withdrawals.ts (เซน/นุ่น)       → recordWithdrawal()
 *
 * หลักการออกแบบ (คำถามที่อาจารย์น่าจะถาม)
 *   ถาม: ทำไมแยกเป็นไฟล์ service ไม่เขียนในหน้าเว็บเลย
 *   ตอบ: หลายหน้าใช้ logic เดียวกัน (เช่น pay() ถูกเรียกจากหน้าร้าน ส่วนประวัติถูกอ่าน
 *        จากหน้าลูกค้า ร้าน และ Admin) ถ้าเขียนซ้ำหลายที่ ตัวเลขอาจคำนวณไม่ตรงกัน
 *        แยกไว้ที่เดียว = กติกาเรื่องเงินมีที่เดียว แก้ที่เดียว ทดสอบที่เดียว
 *
 *   ถาม: ทำไมต้องบันทึก transaction ทุกครั้ง แค่เก็บยอดไม่พอเหรอ
 *   ตอบ: ยอดบอกแค่ "ตอนนี้มีเท่าไหร่" แต่ไม่บอกว่ามาจากไหน
 *        ระบบเงินต้องตรวจสอบย้อนหลังได้ (audit trail) เช่น ลูกค้าถามว่าเงินหายไปไหน
 *        หรือ Organizer ต้องเคลียร์เงินกับร้านหลังจบงาน จึงต้องมีประวัติทุกครั้ง
 *
 *   ถาม: ทำไมฟังก์ชันที่เปลี่ยนยอด (changeBalance) ไม่ export
 *   ตอบ: กันไม่ให้ไฟล์อื่นแก้ยอดเงินตรง ๆ โดยไม่บันทึกประวัติ
 *        ทุกการเปลี่ยนยอดต้องผ่านฟังก์ชันที่ export (topup / pay / withdrawal)
 *        ซึ่งบันทึก transaction ให้เสมอ — เป็นหลัก encapsulation
 */

import type { ID, TokenTransaction } from "../types";
// มาจาก lib/storage.ts — ตัวกลางอ่าน/เขียน localStorage ที่ทุกคนใช้ร่วมกัน
//   readStore   อ่านข้อมูล 1 ชุด
//   updateStore อ่าน → แก้ → เขียนกลับ ในครั้งเดียว และแจ้งหน้าเว็บให้อัปเดต
//   generateId  สร้าง id ไม่ซ้ำ เช่น "tx_m1x2_ab12"
//   nowISO      เวลาปัจจุบันรูปแบบมาตรฐาน ISO
import { generateId, nowISO, readStore, updateStore } from "../storage";
// มาจาก lib/services/audit.ts — บันทึกว่า Admin คนไหนทำอะไร
import { logAction } from "./audit";

/* ═══════════════════════ ฟังก์ชันช่วย (ใช้ภายในไฟล์นี้เท่านั้น) ═══════════════════════ */

/**
 * changeBalance — เพิ่มหรือลดยอด Token ของผู้ใช้ 1 คน
 *
 * รับ:  userId = ของใคร, delta = เปลี่ยนเท่าไหร่ (+500 = เพิ่ม, -60 = ลด)
 * คืน:  ไม่มี (void)
 *
 * ขั้นตอน
 *   1. อ่านกระเป๋าทุกใบ (updateStore ส่งเข้ามาเป็น wallets)
 *   2. ถ้าคนนี้ยังไม่มีกระเป๋า → สร้างใบใหม่ ยอด = delta
 *   3. ถ้ามีแล้ว → สร้างใบใหม่ที่ยอดบวก delta แทนที่ใบเดิม
 *   4. สิ่งที่ return ออกไป updateStore จะบันทึกลง localStorage ให้
 *
 * ทำไมเขียนแบบนี้
 *   - ใช้ตัวเดียวทั้งบวกและลบ (ส่ง -amount มาเพื่อลด) ไม่ต้องมี add/subtract แยก
 *   - สร้างกระเป๋าให้อัตโนมัติ → ตอนสมัครสมาชิกไม่ต้องสร้างกระเป๋า
 *     users.ts จึงไม่ต้องยุ่งกับข้อมูล wallets ของไฟล์นี้
 *   - .some() ถามแค่ "มีไหม" ได้ true/false ตรงความหมายกว่า .find()
 *   - ไม่แก้ object เดิม (w.balance += delta) แต่สร้างใหม่ด้วย { ...w, balance }
 *     เรียกว่า immutable update เป็นแนวทางมาตรฐานของ React
 *     ช่วยให้หน้าเว็บรู้ว่าข้อมูลเปลี่ยน และลดบั๊กจากการแก้ข้อมูลที่คนอื่นถืออยู่
 *   - ไม่ export → ไฟล์อื่นเปลี่ยนยอดโดยไม่บันทึกประวัติไม่ได้
 */
function changeBalance(userId: ID, delta: number): void {
  updateStore("wallets", (wallets) => {
    const exists = wallets.some((w) => w.userId === userId);
    if (!exists) {
      // [...wallets, ใบใหม่] = คัดลอกทุกใบเดิม แล้วต่อท้ายด้วยใบใหม่
      return [...wallets, { userId, balance: delta }];
    }
    // .map วนทุกใบ: ใบที่ใช่ → ใบใหม่ที่ยอดเปลี่ยนแล้ว, ใบอื่น → คืนตัวเดิม
    // เงื่อนไข ? ค่าถ้าจริง : ค่าถ้าเท็จ
    return wallets.map((w) =>
      w.userId === userId ? { ...w, balance: w.balance + delta } : w,
    );
  });
}

/**
 * addTransaction — บันทึกธุรกรรม 1 รายการ
 *
 * รับ:  ข้อมูลธุรกรรม "ยกเว้น" id กับ createdAt
 * คืน:  ธุรกรรมที่บันทึกแล้ว (มี id และเวลาครบ)
 *
 * ทำไมเขียนแบบนี้
 *   - Omit<TokenTransaction, "id" | "createdAt"> = type ที่เหมือน TokenTransaction
 *     ทุกช่อง ยกเว้น 2 ช่องนี้ → คนเรียกไม่ต้องสร้าง id/เวลาเอง และสร้างผิดไม่ได้
 *   - [newTx, ...list] ใส่รายการใหม่ไว้หน้าสุด → หน้าประวัติเรียงใหม่ไปเก่าเลย
 *     ไม่ต้อง sort ทุกครั้งที่แสดง
 *   - คืน newTx ออกไป ให้คนเรียกเอาไปแสดงผล เช่น "เติมสำเร็จ รายการ tx_..."
 */
function addTransaction(
  tx: Omit<TokenTransaction, "id" | "createdAt">,
): TokenTransaction {
  const newTx: TokenTransaction = { ...tx, id: generateId("tx"), createdAt: nowISO() };
  updateStore("tokenTransactions", (list) => [newTx, ...list]);
  return newTx;
}

/**
 * isValidAmount — ยอดถูกต้องไหม (จำนวนเต็ม และมากกว่า 0)
 *
 * ทำไมต้องเป็นจำนวนเต็ม: 1 บาท = 1 Token ไม่มีเศษสตางค์
 * ทำไมแยกเป็นฟังก์ชัน: กติกาอยู่ที่เดียว (หลัก DRY — Don't Repeat Yourself)
 *   ถ้าวันหลังเปลี่ยนกติกา เช่น ห้ามเติมเกิน 10,000 แก้ที่นี่ที่เดียว
 * ทำไมมีทั้ง isValidAmount และ assertValidAmount: ดูคำอธิบายของ pay()
 */
function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

/**
 * assertValidAmount — ถ้ายอดไม่ถูกต้องให้ throw error ทันที
 *
 * ใช้กับฟังก์ชันที่ "ยอดผิด = บั๊กของโปรแกรม" เช่น topup, recordWithdrawal
 * หน้าเว็บที่เรียกจะจับ error ด้วย try/catch แล้วแสดงข้อความแดง
 */
function assertValidAmount(amount: number) : void {
  if (!isValidAmount(amount)) {
    throw new Error("จำนวน Token ต้องเป็นจำนวนเต็มมากกว่า 0");
  }
}

/* ═══════════════════════ ฟังก์ชันที่ไฟล์อื่นเรียกใช้ได้ (export) ═══════════════════════ */

/**
 * getBalance — ดูยอด Token คงเหลือ
 *
 * รับ:  userId
 * คืน:  ยอด (ตัวเลข) — ถ้ายังไม่มีกระเป๋า คืน 0
 * ใครเรียก: pay() และ recordWithdrawal() ในไฟล์นี้ (เช็กยอดก่อนหัก), หน้า wallet ของปอ
 *
 * อธิบายทีละบรรทัด
 *   readStore("wallets")  → กระเป๋าทุกใบ
 *   .find(...)            → ใบแรกที่ userId ตรง (ไม่เจอ = undefined)
 *   wallet?.balance       → ?. ถ้า wallet มีค่าค่อยเอา .balance ถ้าไม่มีได้ undefined (ไม่ error)
 *   ?? 0                  → ถ้าทางซ้ายเป็น undefined/null ใช้ 0 แทน
 *
 * ถาม: ทำไมหน้าเว็บบางหน้าใช้ useStore("wallets") แทนฟังก์ชันนี้
 * ตอบ: ฟังก์ชันนี้อ่านครั้งเดียวตอนเรียก ส่วน useStore อัปเดตหน้าเว็บอัตโนมัติ
 *      เมื่อยอดเปลี่ยน — service ใช้ readStore, หน้าเว็บที่ต้องการให้ตัวเลขขยับเองใช้ useStore
 */
export function getBalance(userId: ID): number {
  const wallets = readStore("wallets");
  const wallet = wallets.find((w) => w.userId === userId);
  return wallet?.balance ?? 0;
}

/**
 * topupOnline — ลูกค้าเติม Token เองผ่าน QR (จำลอง)
 *
 * รับ:  customerId, amount
 * คืน:  ธุรกรรมที่บันทึก
 * ใครเรียก: หน้า /customer/wallet (ปอ) หลังกด "จำลองชำระสำเร็จ"
 *
 * ขั้นตอน: ตรวจยอด → เพิ่มยอด → บันทึกธุรกรรม
 *
 * ข้อมูลที่บันทึก
 *   type: "topup"       ประเภท = เติม
 *   fromUserId: null    เงินมาจากนอกระบบ (ลูกค้าจ่ายบาทเข้ามา) จึงไม่มีผู้ส่งในระบบ
 *   toUserId            ลูกค้าเป็นผู้รับ Token
 *   channel: "online_qr" ช่องทาง ใช้แยกยอดเติมออนไลน์กับหน้างานในรายงาน
 *   amount,             = amount: amount (ชื่อตัวแปรตรงกับชื่อช่อง เขียนย่อได้)
 *
 * ถาม: ทำไมเพิ่มยอดก่อนแล้วค่อยบันทึก ถ้าบันทึกพังจะเกิดอะไร
 * ตอบ: ใน prototype ทั้งสองขั้นเขียน localStorage ในเครื่องเดียวกันแทบไม่มีโอกาสพัง
 *      ถ้าเป็นระบบจริงต้องใช้ database transaction ให้สองขั้นสำเร็จหรือล้มเหลวพร้อมกัน
 */
export function topupOnline(customerId: ID, amount: number): TokenTransaction {
  assertValidAmount(amount);
  changeBalance(customerId, amount);
  return addTransaction({
    type: "topup",
    amount,
    fromUserId: null,
    toUserId: customerId,
    channel: "online_qr",
  });
}

/**
 * topupOnsite — Admin เติม Token ให้ลูกค้าที่หน้างาน (เงินสด / QR)
 *
 * รับ:  object { customerId, amount, channel, adminId }
 * คืน:  ธุรกรรมที่บันทึก
 * ใครเรียก: หน้า /admin/topup (หลังค้นหาลูกค้าด้วย Customer ID แล้ว)
 *
 * ต่างจาก topupOnline 3 จุด
 *   1. channel เลือกได้ 2 แบบ "onsite_cash" | "onsite_qr" (พิมพ์ผิด TypeScript ขีดแดง)
 *   2. บันทึก performedBy = Admin คนที่เติม
 *   3. บันทึก Audit Log เพราะเป็นการกระทำของ Admin ที่เกี่ยวกับเงิน
 *
 * ทำไมรับเป็น object ไม่ส่งทีละตัว
 *   มี 4 ค่า ถ้าส่งเรียง topupOnsite("u_customer", 200, "onsite_cash", "u_admin")
 *   จำลำดับยาก สลับผิดง่าย (เช่น สลับ customerId กับ adminId TypeScript ไม่เตือน
 *   เพราะเป็น string ทั้งคู่) แบบ object เห็นชื่อชัดทุกค่า
 *
 * const { customerId, ... } = input  เรียกว่า destructuring
 *   แตก object ออกเป็นตัวแปรแยก เขียน amount แทน input.amount
 *
 * ทำไมเก็บผลไว้ใน tx ก่อน return
 *   ต้องบันทึก Audit Log ต่อหลังบันทึกธุรกรรม จึง return ทันทีไม่ได้
 */
export function topupOnsite(input: {
  customerId: ID;
  amount: number;
  channel: "onsite_cash" | "onsite_qr";
  adminId: ID;
}): TokenTransaction {
  const { customerId, amount, channel, adminId } = input;
  assertValidAmount(amount);
  changeBalance(customerId, amount);
  const tx = addTransaction({
    type: "topup",
    amount,
    fromUserId: null,
    toUserId: customerId,
    channel,
    performedBy: adminId,
  });
  logAction({
    actorId: adminId,
    action: "wallet.topup",
    targetId: customerId,
    detail: `เติม ${amount} Token (${channel === "onsite_cash" ? "เงินสด" : "QR"})`,
  });
  return tx;
}

/**
 * pay — ย้าย Token จากลูกค้าไปร้านค้า (ซื้อของที่ร้าน)
 *
 * รับ:  { customerId, vendorId, vendorUserId, amount, note? }
 * คืน:  สำเร็จ { ok: true, tx }  หรือ  ไม่สำเร็จ { ok: false, reason }
 * ใครเรียก: sellToCustomer() ใน vendors.ts (นุ่น) — ร้านใส่จำนวน สแกน QR ลูกค้า แล้วกดยืนยัน
 *
 * ทำไมมีทั้ง vendorId และ vendorUserId
 *   vendorId     = id ของ "ร้าน" (vd_coffee) เก็บในธุรกรรมให้รายงานรู้ว่าขายที่ร้านไหน
 *   vendorUserId = id ของ "บัญชีผู้ใช้" เจ้าของร้าน (u_vendor) — กระเป๋า Token ผูกกับบัญชี
 *
 * ทำไมไม่ throw แต่คืน { ok, reason }
 *   throw ใช้กับสิ่งที่ "ไม่ควรเกิด" = บั๊ก
 *   "Token ไม่พอ" เป็นเรื่องปกติที่เกิดได้บ่อยหน้าร้าน ต้องแสดงข้อความให้ร้านและลูกค้าเห็น
 *   การคืนผลลัพธ์แบบนี้ TypeScript บังคับให้คนเรียกเช็ก result.ok ก่อนเสมอ ลืมไม่ได้
 *   (type แบบ A | B เรียกว่า union type; เช็ก ok แล้ว TypeScript รู้ว่าเป็นแบบไหน = narrowing)
 *   จึงใช้ isValidAmount (คืน true/false) ไม่ใช้ assertValidAmount (throw)
 *
 * ลำดับสำคัญมาก
 *   ตรวจทุกอย่างให้ผ่าน "ก่อน" แล้วค่อยหัก/เพิ่มยอด
 *   ถ้าหักลูกค้าไปแล้วค่อยพบว่ามีปัญหา Token จะหายไปเฉย ๆ
 *
 * -amount  ส่งค่าติดลบเข้า changeBalance เพื่อลดยอด
 * note?    ไม่บังคับ เช่น "หมูปิ้ง ×10" ให้ลูกค้าเห็นว่าจ่ายค่าอะไร
 * `...${balance}...`  template string (backtick) ใส่ตัวแปรในข้อความได้
 */
export function pay(input: {
  customerId: ID;
  vendorId: ID;
  vendorUserId: ID;
  amount: number;
  note?: string;
}): { ok: true; tx: TokenTransaction } | { ok: false; reason: string } {
  const { customerId, vendorId, vendorUserId, amount, note } = input;

  // ด่าน 1: ยอดต้องถูกต้อง
  if (!isValidAmount(amount)) {
    return { ok: false, reason: "จำนวน Token ต้องเป็นจำนวนเต็มมากกว่า 0" };
  }

  // ด่าน 2: ลูกค้าต้องมี Token พอ
  const balance = getBalance(customerId);
  if ( balance < amount) {
    return { ok: false, reason: `Token ไม่พอ (คงเหลือ ${balance})`};
  }

  // ผ่านทุกด่านแล้ว → ย้ายเงิน
  changeBalance(customerId, -amount);
  changeBalance(vendorUserId, amount);

  const tx = addTransaction({
    type: "payment",
    amount,
    fromUserId: customerId,
    toUserId: vendorUserId,
    vendorId,
    note,
  });
  return { ok: true, tx };
}

/**
 * recordWithdrawal — หัก Token ของร้านเมื่อ Admin บันทึกว่าโอนเงินบาทให้แล้ว
 *
 * รับ:  { vendorUserId, vendorId, amount, withdrawalId, adminId }
 * คืน:  ธุรกรรมที่บันทึก
 * ใครเรียก: withdrawals.ts ฝั่ง Admin ตอนกด "บันทึกผลการโอนเงิน"
 *
 * Flow การถอน: ร้านขอถอน (pending) → Admin อนุมัติ (approved)
 *              → Admin โอนเงินจริงแล้วบันทึก (transferred) → เรียกฟังก์ชันนี้หัก Token
 *
 * ข้อมูลที่บันทึก
 *   fromUserId = ร้าน, toUserId = null  → Token ออกจากระบบไปเป็นเงินบาท
 *                                          (กลับด้านกับ topup ที่ from = null)
 *   withdrawalId → ผูกกับคำขอถอน ย้อนดูได้ว่ามาจากคำขอไหน
 *
 * ทำไมยอดไม่พอถึง throw (ไม่เหมือน pay)
 *   ตอนร้านสร้างคำขอถอน ระบบต้องเช็กยอดไว้แล้ว ถ้ามาถึงตรงนี้แล้วยอดไม่พอ
 *   แปลว่ามีบางอย่างผิดปกติ (บั๊ก) ไม่ใช่เหตุการณ์ปกติ → ใช้ throw ตามหลักเดียวกับ pay
 */
export function recordWithdrawal(input: {
  vendorUserId: ID;
  vendorId: ID;
  amount: number;
  withdrawalId: ID;
  adminId: ID;
}): TokenTransaction {
  const { vendorUserId, vendorId, amount, withdrawalId, adminId } = input;
  assertValidAmount(amount);

  const balance = getBalance(vendorUserId);
  if (balance < amount) {
    throw new Error(`ยอด Token ของร้านไม่พอถอน (คงเหลือ ${balance} Token)`);
  }

  changeBalance(vendorUserId, -amount);
  return addTransaction({
    type: "withdrawal",
    amount,
    fromUserId: vendorUserId,
    toUserId: null,
    vendorId,
    withdrawalId,
    performedBy: adminId,
  });
}

/**
 * listTransactions — ประวัติธุรกรรม (ใหม่ → เก่า)
 *
 * รับ:  userId (ไม่บังคับ — มี ? )
 * คืน:  รายการธุรกรรม
 * ใครเรียก: หน้า wallet ของลูกค้า (ส่ง userId), หน้าธุรกรรมของร้าน (ส่ง userId),
 *           หน้า /admin/transactions (ไม่ส่ง = ดูทั้งหมด)
 *
 * .filter(...)  คืน array ใหม่ที่มีเฉพาะตัวที่เงื่อนไขเป็นจริง (ต่างจาก .find ที่คืนแค่ตัวแรก)
 * ||            "หรือ" — เก็บรายการที่คนนี้เป็นผู้จ่าย หรือ ผู้รับ
 *               ลูกค้าจะเห็นทั้งรายการเติมและรายการจ่าย ร้านจะเห็นทั้งรายการรับและรายการถอน
 * ไม่ต้อง sort  เพราะ addTransaction ใส่รายการใหม่ไว้หน้าสุดอยู่แล้ว
 */
export function listTransactions(userId?: ID): TokenTransaction[] {
  const all = readStore("tokenTransactions");
  if (!userId) {
    return all;
  }
  return all.filter((tx) => tx.fromUserId === userId || tx.toUserId === userId);
}
