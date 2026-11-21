/**
 * ═══════════════════════════════════════════════════════════════════════
 * lib/services/audit.ts — บันทึกการทำงานของผู้ดูแลระบบ (Audit Log)
 * เจ้าของ: นัฐวิ (เซน) · Admin
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ไฟล์นี้ทำอะไร
 *   จดว่า "ใคร ทำอะไร กับใคร/อะไร เมื่อไหร่" ทุก role ทั้งเว็บ
 *   (ล็อกอิน/ออก, เติมเงิน, ซื้อบัตร, เช็กอิน, ขายของ, ถอนเงิน, งานของ Admin ฯลฯ)
 *   ให้ Admin ตรวจสอบย้อนหลังได้ที่หน้า /admin/audit-logs
 *
 * ข้อมูลที่ไฟล์นี้ดูแล
 *   auditLogs  [{ id, actorId, action, targetId?, detail?, createdAt }]
 *
 * ใครเรียก logAction
 *   auth.tsx       → ล็อกอิน/ล็อกอินไม่ผ่าน/ออกจากระบบ/สมัคร/แก้โปรไฟล์/เปลี่ยนรหัส (auth.*)
 *   users.ts       → สร้างบัญชี, ระงับ/เปิดใช้ (user.*)
 *   wallet.ts      → เติม Token ออนไลน์/หน้างาน (wallet.*)
 *   tickets.ts     → ซื้อบัตร, เช็กอิน (ticket.*)
 *   events.ts      → สร้าง/แก้งาน, ประเภทบัตร (event.*)
 *   merch.ts       → สินค้า, สั่งซื้อ, ขายหน้าบูธ, จัดส่ง (merch.*)
 *   vendors.ts     → สร้าง/แก้ร้าน, ขายให้ลูกค้า, บัญชีธนาคาร (vendor.*)
 *   withdrawals.ts → ขอถอน/อนุมัติ/ปฏิเสธ/บันทึกโอน (withdrawal.*)
 * ใครอ่าน: หน้า /admin/audit-logs
 *
 * ถาม: Audit Log ต่างจาก tokenTransactions ใน wallet.ts ยังไง
 * ตอบ: tokenTransactions บันทึก "เงิน" เปลี่ยน (ใครได้ ใครเสีย เท่าไหร่)
 *      Audit Log บันทึก "การกระทำของ Admin" รวมเรื่องที่ไม่เกี่ยวกับเงิน
 *      เช่น สร้างบัญชี ระงับบัญชี แก้ราคาร้าน — ใช้ตรวจสอบว่า Admin ทำอะไรไปบ้าง
 *
 * ถาม: ทำไมแยกเป็นไฟล์ของตัวเอง
 * ตอบ: หลายไฟล์ต้องบันทึก log เหมือนกัน รวมไว้ที่เดียวจะได้รูปแบบเดียวกันทุกที่
 */

import type { AuditLog, ID } from "../types";
import { generateId, nowISO, readStore, updateStore } from "../storage";

/**
 * logAction — บันทึก 1 รายการ
 *
 * รับ:  { actorId, action, targetId?, detail? }
 *   actorId   Admin ที่ทำ
 *   action    ตั้งชื่อแบบ "สิ่งของ.การกระทำ" เช่น "user.create", "wallet.topup"
 *             รูปแบบตายตัว → หน้า Audit Log กรองหรือแปลเป็นภาษาไทยได้ง่าย
 *   targetId  ทำกับใคร/อะไร (ไม่บังคับ)
 *   detail    ข้อความอ่านง่าย เช่น "เติม 500 Token (เงินสด)" (ไม่บังคับ)
 * คืน:  log ที่บันทึกแล้ว
 *
 * { ...input, id, createdAt }  คัดลอกทุกช่องจาก input แล้วเติม id กับเวลาให้อัตโนมัติ
 * [log, ...logs]               ใส่ไว้หน้าสุด → อ่านแล้วเรียงใหม่ไปเก่าเลย
 * โครงเดียวกับ addTransaction ใน wallet.ts แต่ตัวนี้ export
 * เพราะไฟล์อื่นต้องเรียกใช้ ส่วน addTransaction เป็นของใช้ภายใน wallet.ts เท่านั้น
 */
export function logAction(input: {
  actorId?: ID;
  action: string;
  targetId?: ID;
  detail?: string;
}): AuditLog {
  // ไม่ส่ง actorId มา → ใช้คนที่ล็อกอินอยู่ (ไม่มีใครล็อกอิน = "system")
  const actorId = input.actorId ?? readStore("session")?.userId ?? "system";
  const log: AuditLog = { ...input, actorId, id: generateId("log"), createdAt: nowISO() };
  updateStore("auditLogs", (logs) => [log, ...logs]);
  return log;
}

/**
 * listAuditLogs — ประวัติทั้งหมด (ใหม่ → เก่า)
 * ใครเรียก: หน้า /admin/audit-logs
 * ไม่มีฟังก์ชันแก้หรือลบ log โดยตั้งใจ — บันทึกตรวจสอบต้องแก้ย้อนหลังไม่ได้
 */
export function listAuditLogs(): AuditLog[] {
  return readStore("auditLogs");
}
