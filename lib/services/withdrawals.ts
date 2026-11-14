/**
 * lib/services/withdrawals.ts — คำขอถอนเงินของ Vendor
 * เจ้าของ: นัฐวิ ทั้งฝั่งสร้างคำขอ  และฝั่งอนุมัติ
 * ข้อมูลที่ดูแล: withdrawals
 *
 * Flow: pending → approved → transferred   หรือ   pending → rejected
 * ตอน transferred ให้เรียก wallet.recordWithdrawal() เพื่อหัก Token ของ Vendor
 */
import type { ID, Withdrawal } from "../types";
import { generateId, nowISO, readStore, updateStore } from "../storage"; // อ่าน/เขียน localStorage + สร้าง ID + เวลาปัจจุบัน
import { getBalance, recordWithdrawal } from "./wallet"; // getBalance = เช็กยอดร้านก่อนขอถอน · recordWithdrawal = หัก Token ตอนโอนแล้ว
import { getVendor } from "./vendors"; // getVendor = หาร้านเพื่อเอา userId (กระเป๋า Token ผูกกับ userId ไม่ใช่ vendorId)
import { logAction } from "./audit"; // logAction = จดว่า Admin อนุมัติ/ปฏิเสธ/โอน

/* ── ฝั่ง Vendor (นัฐวิ ) ── */

/** หาคำขอถอนจาก id — ไม่เจอ throw (ใช้ในฝั่ง Admin) */
function findWithDrawal(withdrawalId: ID): Withdrawal {
  const found = readStore("withdrawals").find((w) => w.id === withdrawalId);
  if (!found)  throw new Error("ไม่พบคำขอถอนเงินนี้");
  return found;
}

/** แทนคำขอ 1 รายการด้วยค่าใหม่ แล้วคืนค่าใหม่ */
function saveWithdrawal(next: Withdrawal): Withdrawal {
  updateStore("withdrawals", (list) =>
    list.map((w) => (w.id === next.id ? next : w)),
  );
  return next;
}

/** ต้องเช็กว่ายอด Token ของร้านพอ และไม่มีคำขอ pending ค้างเกินยอด 
 * ร้านขอถอนเงิน — ยังไม่หัก Token (หักตอน Admin กด "โอนแล้ว")
 * ผิดเงื่อนไข throw ข้อความไทย ให้หน้าเว็บ try/catch แล้วโชว์
*/
export function requestWithdrawal(input: {
  vendorId: ID;
  amount: number;
  bankAccountId: ID;
}): Withdrawal {
  // 1 : ร้านมีจริง
  const vendor = getVendor(input.vendorId);
  if (!vendor) throw new Error("ไม่พบร้านค้า");

  // 2 : ยอดต้องเป็นจำนวนเต็มมากกว่า 0
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("จำนวนเงินต้องเป็นจำนวนเต็มมากกว่า 0");
  }

  // 3 : บัญชีธนาคารต้องเป็นของร้านนี้ (กันส่ง id บัญชีคนอื่นมา)
  // ด่าน 3: หน้าเว็บส่งมาแค่ id บัญชี ต้องเช็กว่าเป็นบัญชีของร้านนี้จริง ไม่งั้นแก้ id ให้เงินเข้าบัญชีคนอื่นได้
  const account = readStore("bankAccounts").find(
    (a) => a.id === input.bankAccountId && a.vendorId === vendor.id,
  );
  if (!account) throw new Error("กรุณาเลือกบัญชีธนาคารของร้าน");

  // 4 : ห้ามีคำขอค้าง (ต้องรออนุมัติ หรือ อนุมัติแล้วรอโอน)
  // ด่าน 4: ถ้าไม่กัน ร้านมี 1,000 แต่กดขอถอน 1,000 สามรอบก่อน Admin อนุมัติ ยอดรวมขอไป 3,000 เกินที่มี ทางที่ง่ายที่สุดคือให้มีคำขอค้างได้ทีละอัน
  const hasOpen = readStore("withdrawals").some(
    (w) =>
      w.vendorId === vendor.id &&
      (w.status === "pending" || w.status === "approved"),
  );
  if (hasOpen) throw new Error("มีคำขอถอนที่ยังไม่เสร็จอยู่ รอ Admin ดำเนินการก่อน");

  // 5 : Token ในกระเป๋าร้านต้องพอ (กระเป๋าผูกกับ userId ของเจ้าของร้าน)
  // ด่าน 5: ใช้ vendor.userId ไม่ใช่ vendorId เพราะกระเป๋า Token ผูกกับบัญชีผู้ใช้
  const balance = getBalance(vendor.userId);
  if (input.amount > balance) {
    throw new Error(`ยอด Token ไม่พอ (คงเหลือ ${balance.toLocaleString()})`);
  }

  // ผ่านทุกส่วน -> สร้างขอคำสถานะ "pending"
  const withdrawal: Withdrawal = {
    id: generateId("wd"),
    vendorId: vendor.id,
    amount: input.amount,
    bankAccountId: account.id,
    status: "pending",
    requestedAt: nowISO(),
  };
  updateStore("withdrawals", (list) => [withdrawal, ...list]); // ใหม่อยู่บนสุด
  return withdrawal;
  // ไม่เรียก logAction: Audit Log ใช้เก็บสิ่งที่ Admin ทำ ส่วนการขอถอนเป็นของร้าน และคำขอเองก็เป็นหลักฐานอยู่แล้ว (มี requestedAt)
}

/** คำขอของร้านนี้ทั้งหมด ล่าสุดขึ้นก่อน (ใช้ในหน้า /vendor/withdraw) */
export function listWithdrawalsByVendor(vendorId: ID): Withdrawal[] {
  return readStore("withdrawals")
    .filter((w) => w.vendorId === vendorId)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

/* ── ฝั่ง Admin (นัฐวิ) ── */

/** คำขอที่ Admin ยังต้องจัดการ (รออนุมัติ + อนุมัติแล้วรอโอน) เก่าสุดขึ้นก่อน */
export function listPendingWithdrawals(): Withdrawal[] {
  return readStore("withdrawals")
    .filter((w) => w.status === "pending" || w.status === "approved")
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}

/**
 * Admin อนุมัติ → สถานะ "approved" (รอโอน) — ยังไม่หัก Token
 * อนุมัติได้เฉพาะคำขอที่ยัง "pending"
 */
export function approveWithdrawal(withdrawalId: ID, adminId: ID): Withdrawal {
  const w = findWithDrawal(withdrawalId);
  if (w.status !== "pending") throw new Error("คำขอนี้ไม่ได้อยู่ในสถานะรออนุมัติ");

  // เช็กยอดซ้ำอีกรอบ - ระหว่างรอ ร้านอาจถูกหัก Token ไปแล้ว
  const vendor = getVendor(w.vendorId);
  if (!vendor) throw new Error("ไม่พบร้านค้า");
  if (getBalance(vendor.userId) < w.amount) {
    throw new Error("ยอด Token ของร้านไม่พอแล้ว ควรปฏิเสธคำขอนี้");
  }

  const next = saveWithdrawal({
    ...w, // ค่าเดิมทั้งหมด แล้วทับเฉพาะช่องที่เปลี่ยน
    status: "approved",
    reviewedBy: adminId,
    reviewedAt: nowISO(),
  });
  logAction({
    actorId: adminId,
    action: "withdrawal.approve",
    targetId: w.id,
    detail: `อนุมัติถอน ${w.amount.toLocaleString()} บาท · ${vendor.shopName}`,
  });
  return next;
}

/**
 * Admin ปฏิเสธพร้อมเหตุผล → สถานะ "rejected"
 * Token ร้านไม่ถูกหัก (เพราะยังไม่เคยหัก) ร้านขอใหม่ได้ทันที
 */
export function rejectWithdrawal(
  withdrawalId: ID,
  adminId: ID,
  reason: string,
): Withdrawal {
  const w = findWithDrawal(withdrawalId);
  // ปฏิเสธได้ทั้งตอนรออนุมัติ และตอนอนุมัติแล้วแต่ยังไม่โอน (เช่น เจอบัญชีผิดตอนจะโอน)
  if (w.status !== "pending" && w.status !== "approved") {
    throw new Error("คำขอนี้ดำเนินการเสร็จไปแล้ว");
  }
  const text = reason.trim();
  if (!text) throw new Error("กรุณาใส่เหตุผลที่ไม่อนุมัติ");

  const next = saveWithdrawal({
    ...w,
    status: "rejected",
    rejectReason: text,
    reviewedBy: adminId,
    reviewedAt: nowISO(),
  });
  logAction({
    actorId: adminId,
    action: "withdrawal.reject",
    targetId: w.id,
    detail: `ไม่อนุมัติถอน ${w.amount.toLocaleString()} บาท · ${text}`,
  });
  return next;
  // เช็กสถานะก่อนทุกครั้ง: กันกดซ้ำ เช่น อนุมัติคำขอที่โอนไปแล้ว หรือปฏิเสธคำขอที่ปฏิเสธไปแล้ว
  // อนุมัติต้องเช็กยอดอีกรอบ: ยอดตอนร้านกดขออาจไม่ใช่ยอดตอนนี้แล้ว
  // { ...w, status: ... }: คัดลอกคำขอเดิมทั้งก้อน แล้วเปลี่ยนแค่ช่องที่ต้องเปลี่ยน ช่องอื่นอย่างยอดเงินหรือบัญชีอยู่ครบ
  // ปฏิเสธต้องมีเหตุผล: ร้านจะได้รู้ว่าต้องแก้อะไร เช่น ชื่อบัญชีไม่ตรง และ .trim() กันพิมพ์แค่ช่องว่างแล้วผ่าน
  // ทุกการกระทำของ Admin เรียก logAction: ใช้ชื่อ withdrawal.approve / withdrawal.reject ตามรูปแบบที่ types.ts เขียนตัวอย่างไว้
}

/**
 * Admin โอนเงินจริงแล้ว ใส่เลขอ้างอิงการโอน → หัก Token ร้าน → สถานะ "transferred"
 * ต้องอนุมัติก่อนเท่านั้น (approved)
 */
export function markTransferred(
  withdrawalId: ID,
  adminId: ID,
  transferRef: string,
): Withdrawal {
  const w = findWithDrawal(withdrawalId);
  if (w.status !== "approved") throw new Error("ต้องอนุมัติคำขอก่อนบันทึกการโอน");

  const ref = transferRef.trim();
  if (!ref) throw new Error("กรุณาใส่เลขอ้างอิงการโอน");
  
  const vendor = getVendor(w.vendorId);
  if (!vendor) throw new Error("ไม่พบร้านค้า");

  // หัก Token ก่อน — ถ้ายอดไม่พอ recordWithdrawal จะ throw
  // แล้วโค้ดด้านล่างจะไม่ทำงาน สถานะยังเป็น approved เหมือนเดิม (ไม่มีครึ่ง ๆ กลาง ๆ)
  recordWithdrawal({
    vendorUserId: vendor.userId,
    vendorId: vendor.id,
    amount: w.amount,
    withdrawalId: w.id,
    adminId,
  });

  const next = saveWithdrawal({
    ...w,
    status: "transferred",
    transferRef: ref,
    transferredAt: nowISO(),
  });
  logAction({
    actorId: adminId,
    action: "withdrawal.transfer",
    targetId: w.id,
    detail: `โอน ${w.amount.toLocaleString()} บาท · ${vendor.shopName} · อ้างอิง ${ref}`,
  });
  return next;

  // ต้อง approved ก่อน: บังคับลำดับ ขอ → อนุมัติ → โอน ข้ามขั้นไม่ได้ และกดโอนซ้ำก็ไม่ได้ เพราะรอบที่สองสถานะเป็น transferred ไปแล้ว Token จะไม่ถูกหักสองรอบ
  // หัก Token ก่อน แล้วค่อยเปลี่ยนสถานะ: ถ้าหักไม่สำเร็จ (ยอดไม่พอ) recordWithdrawal จะ throw โค้ดหยุดตรงนั้น สถานะยังเป็น approved ข้อมูลไม่เพี้ยน ถ้าสลับลำดับ อาจได้สถานะ "โอนแล้ว" ทั้งที่ Token ยังไม่ถูกหัก
  // ใช้ recordWithdrawal ที่มีอยู่แล้ว: ไม่เขียนการหักเงินซ้ำในไฟล์นี้ กฎเรื่องเงินอยู่ใน wallet.ts ที่เดียว และได้รายการธุรกรรม type withdrawal ไว้ตรวจย้อนหลังอัตโนมัติ
  // บังคับใส่เลขอ้างอิง: เป็นหลักฐานว่าโอนจริง เอาไปเทียบกับสลิปธนาคารได้
}
