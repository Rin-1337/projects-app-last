/**
 * lib/services/wallet.ts — Token Wallet (1 บาท = 1 Token)
 * เจ้าของ: นัฐวิ (Admin)
 * ข้อมูลที่ดูแล: wallets, tokenTransactions
 *
 * ⭐ ทำไฟล์นี้ก่อน — ทิวากรและสุรัมภาต้องเรียกใช้
 *   ทิวากร  → getBalance, topupOnline, pay, listTransactions
 *   สุรัมภา → getBalance, listTransactions
 *   นัฐวิ    → topupOnsite, recordWithdrawal
 *
 * ทุกฟังก์ชันที่เปลี่ยนยอดต้องบันทึก TokenTransaction เสมอ
 */
import type { ID, TokenTransaction } from "../types";
import { generateId, nowISO, readStore, updateStore } from "../storage";

// ไม่มี export: ไฟล์อื่นเรียกใช้ไม่ได้ เพราะไม่อยากให้ใครเปลี่ยนยอดโดยไม่บันทึกธุรกรรม
// delta: จำนวนที่เปลี่ยน เช่น +500 คือเติม, -60 คือหัก
// updateStore("wallets", (wallets) => …): อ่านกระเป๋าทุกใบส่งเข้ามาเป็น wallets แล้วอะไรที่เรา return จะถูกบันทึกกลับลง localStorage
// .some(...): ถามว่ามีกระเป๋าของคนนี้ไหม ได้ true หรือ false
// ถ้ายังไม่มี: [...wallets, {ใบใหม่}] คือคัดลอกทุกใบเดิม (...) แล้วต่อท้ายด้วยใบใหม่
// ถ้ามีแล้ว: .map วนทุกใบ ใบที่ใช่ให้สร้างใบใหม่ที่ balance บวก delta แล้ว ({ ...w, balance: … } คือคัดลอกทุกช่องของ w แล้วเปลี่ยนเฉพาะ balance) ส่วนใบที่ไม่ใช่ก็คืนตัวเดิม
function changeBalance(userId: ID, delta: number): void {
  updateStore("wallets", (wallets) => {
    const exists = wallets.some((w) => w.userId === userId);
    if (!exists) {
      return [...wallets, { userId, balance: delta }];
    }
    return wallets.map((w) => 
      w.userId === userId ? { ...w, balance: w.balance + delta } : w,
    );
  });
}

// Omit<TokenTransaction, "id" | "createdAt">: type ที่เหมือน TokenTransaction ทุกอย่าง ยกเว้น id กับ createdAt คนเรียกใช้จึงไม่ต้องใส่สองช่องนี้ เพราะฟังก์ชันสร้างให้เอง
// [newTx, ...list]: ใส่รายการใหม่ไว้หน้าสุด หน้าประวัติจะได้เรียงจากใหม่ไปเก่าโดยไม่ต้อง sort
function addTransaction(
  tx: Omit<TokenTransaction, "id" | "createdAt">,
): TokenTransaction {
  const newTx: TokenTransaction = { ...tx, id: generateId("tx"), createdAt: nowISO() };
  updateStore("tokenTransactions", (list) => [newTx, ...list]);
  return newTx;
}
// ยอดถูกต้องไหม: จำนวนเต็มมากกว่า 0 → true / false
function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

// ถ้ายอดไม่ถูกต้องให้ throw Error ออกไป หน้าเว็บจะจับ error นี้ไปแสดงข้อความ
function assertValidAmount(amount: number) : void {
  if (!isValidAmount(amount)) {
    throw new Error("จำนวน Token ต้องเป็นจำนวนเต็มมากกว่า 0");
  }
}

// หยิบกระเป๋าทุกใบมาเก็บไว้ในตัวแปร wallets 
// หากระเป๋าของ userId ตรงกับคนที่ถาม (.find คืนใบแรกที่เจอ ถ้าไม่เจอคืน undefined)
// ถ้าเจอก็คืนยอด balance ถ้าไม่เจอให้คืน 0
// ?. คือ "ถ้ามีค่าค่อยเข้าไปดู" ไม่มีค่าก็ไม่ error
// ?? คือ "ถ้าทางซ้ายว่าง ใช้ค่าทางขวาแทน"
export function getBalance(userId: ID): number {
  const wallets = readStore("wallets");
  const wallet = wallets.find((w) => w.userId === userId);                   
  return wallet?.balance ?? 0;
}

//  Customer เติมผ่าน QR (จำลองชำระสำเร็จแล้วค่อยเรียก) 
 
// บรรทัด if: ตรวจข้อมูลก่อน เช่น เติม -100 หรือ 10.5 ต้องไม่ผ่าน (1 บาท = 1 Token จึงต้องเป็นจำนวนเต็ม)
// throw new Error(...): หยุดฟังก์ชันแล้วส่ง error ออกไป หน้าเว็บของปอจะจับ error นี้ไปแสดงข้อความ (ผมจะอธิบายวิธีจับตอนทดสอบ)
// changeBalance(customerId, amount): บวก Token เข้ากระเป๋าลูกค้า
// addTransaction({...}): บันทึกว่าเป็น topup, Token มาจากข้างนอก (fromUserId: null) เข้าหาลูกค้า (toUserId), ช่องทาง online_qr
// amount, เขียนสั้นแทน amount: amount, ได้ เพราะชื่อตัวแปรตรงกับชื่อช่อง
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

/** Admin เติมหน้างานให้ Customer (ค้นหาด้วย Customer ID)
   * ทำไมรับเป็น object input: มี 4 ค่า ถ้าส่งเรียงกัน topupOnsite("u_customer", 200, "onsite_cash", "u_admin") จะจำลำดับยากและสลับผิดง่าย แบบ object ตอนเรียกจะเห็นชื่อชัดเจน 
   * topupOnsite({ customerId: "u_customer", amount: 200, channel: "onsite_cash", adminId: "u_admin" });
   * channel: "onsite_cash" | "onsite_qr": รับได้แค่ 2 ค่านี้ ถ้าพิมพ์ผิด เช่น "cash" TypeScript จะขีดแดงทันที
   * const { customerId, amount, channel, adminId } = input; เรียกว่า destructuring คือแตก object ออกเป็นตัวแปรแยก จะได้เขียน amount แทน input.amount
   * performedBy: adminId: บันทึกว่า Admin คนไหนเติม ใช้ตรวจสอบย้อนหลังในหน้า Transactions
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
  return addTransaction({
    type: "topup",
    amount,
    fromUserId: null,
    toUserId: customerId,
    channel,
    performedBy: adminId,
  });
}

/** Customer จ่าย Token ให้ร้าน — ต้องเช็กยอดคงเหลือก่อน 
ทำไมมีทั้ง vendorId และ vendorUserId: ร้าน 1 ร้านมี 2 id
  vendorId (เช่น vd_coffee) คือ id ของร้าน เก็บไว้ในธุรกรรม เพื่อให้หน้ารายงานรู้ว่าขายได้ที่ร้านไหน
  vendorUserId (เช่น u_vendor) คือ id ของบัญชีผู้ใช้ที่เป็นเจ้าของร้าน กระเป๋า Token ผูกกับบัญชีนี้

ทำไม pay ไม่ throw แต่คืน { ok, … }:
  throw ใช้กับสิ่งที่ไม่ควรเกิด เช่น โค้ดส่งยอดติดลบมา ซึ่งเป็นบั๊ก
  “Token ไม่พอ” เป็นเรื่องปกติที่เกิดได้บ่อย หน้าจอของปอต้องแสดงข้อความให้ลูกค้าเห็น การคืนผลลัพธ์แบบนี้บังคับให้คนเรียกต้องจัดการเสมอ

type { ok: true; tx } | { ok: false; reason } แปลว่าผลลัพธ์มี 2 แบบเท่านั้น ตอนปอเรียกใช้ TypeScript จะบังคับให้เช็ก ok ก่อน:
const result = pay({ ... });
if (result.ok) {
  // ตรงนี้ใช้ result.tx ได้
} else {
  // ตรงนี้ใช้ result.reason ได้ เช่น แสดง "Token ไม่พอ (คงเหลือ 40 Token)"
}

ลำดับสำคัญ: เช็กทุกอย่างให้ผ่านก่อน แล้วค่อยหักและเพิ่มยอด ถ้าหักลูกค้าไปแล้วค่อยมาพบว่ามีปัญหา Token จะหายไปเฉย ๆ
-amount: ส่งค่าติดลบเข้า changeBalance เพื่อลดยอด ใช้ helper ตัวเดียวทั้งบวกและลบ
`Token ไม่พอ (คงเหลือ ${balance} Token)`: ใช้ backtick (` ปุ่มซ้ายของเลข 1) แทนเครื่องหมายคำพูด เรียกว่า template string ใส่ตัวแปรในข้อความได้ด้วย ${...}
note?: string: เครื่องหมาย ? แปลว่าไม่ส่งมาก็ได้ เช่น ลูกค้าอาจใส่ว่า "ลาเต้เย็น 1 แก้ว" หรือไม่ใส่ก็ได้
*/
export function pay(input: {
  customerId: ID;
  vendorId: ID;
  vendorUserId: ID;
  amount: number;
  note?: string;
}): { ok: true; tx: TokenTransaction } | { ok: false; reason: string } {
  const { customerId, vendorId, vendorUserId, amount, note } = input;

  if (!isValidAmount(amount)) {
    return { ok: false, reason: "จำนวน Token ต้องเป็นจำนวนเต็มมากกว่า 0" };
  }

  const balance = getBalance(customerId);
  if ( balance < amount) {
    return { ok: false, reason: `Token ไม่พอ (คงเหลือ ${balance})`};
  }

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

/** หัก Token ของร้านเมื่อ Admin บันทึกว่าโอนเงินแล้ว */
// toUserId: null: Token ออกจากระบบไปเป็นเงินบาท ไม่ได้ไปหาใคร (กลับด้านกับ topup ที่ fromUserId: null)
// withdrawalId: จับคู่ธุรกรรมนี้กับคำขอถอนใน withdrawals.ts ย้อนดูได้ว่ามาจากคำขอไหน
// ทำไมยอดไม่พอถึง throw ไม่เหมือน pay: ตอนนุ่นสร้างคำขอถอนต้องเช็กยอดไว้แล้ว ถ้ามาถึงตรงนี้แล้วยอดยังไม่พอ แปลว่ามีอะไรผิดปกติ (บั๊ก) ไม่ใช่เรื่องที่ควรเกิดตามปกติ จึงใช้ throw ตามหลักที่เราคุยกันตอน pay
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

// userId?: ID: มี ? แปลว่าไม่ส่งก็ได้ ถ้าไม่ส่ง ค่าจะเป็น undefined และ !userId จะเป็นจริง
// .filter(...): คืน array ใหม่ที่มีเฉพาะตัวที่เงื่อนไขเป็นจริง ต่างจาก .find ที่คืนแค่ตัวแรก
// || คือ "หรือ" เก็บรายการที่คนนี้เป็นผู้จ่ายหรือผู้รับ ลูกค้าจะเห็นทั้งรายการเติมและรายการจ่าย ร้านจะเห็นทั้งรายการรับและรายการถอน
// ไม่ต้อง sort: addTransaction ใส่รายการใหม่ไว้หน้าสุดอยู่แล้ว
export function listTransactions(userId?: ID): TokenTransaction[] {
  const all = readStore("tokenTransactions");
  if (!userId) {
    return all;
  }
  return all.filter((tx) => tx.fromUserId === userId || tx.toUserId === userId);
}
