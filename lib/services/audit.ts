/**
 * ═══════════════════════════════════════════════════════════════════════
 * lib/services/audit.ts — บันทึกการทำงานของผู้ดูแลระบบ (Audit Log)
 * เจ้าของ: นัฐวิ (เซน) · Admin
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ไฟล์นี้ทำอะไร
 *   จดว่า "Admin คนไหน ทำอะไร กับใคร/อะไร เมื่อไหร่" ทุกครั้งที่ Admin ทำรายการสำคัญ
 *   ตาม requirement: "ตรวจสอบประวัติการดำเนินงานของผู้ดูแลระบบ"
 *
 * ข้อมูลที่ไฟล์นี้ดูแล
 *   auditLogs  [{ id, actorId, action, targetId?, detail?, createdAt }]
 *
 * ใครเรียก logAction
 *   users.ts    → สร้างบัญชี (user.create), ระงับ/เปิดใช้ (user.suspend / user.activate)
 *   wallet.ts   → เติม Token หน้างาน (wallet.topup)
 *   vendors.ts  → สร้างร้าน (vendor.create), แก้ราคา/ข้อมูลร้าน (vendor.update)
 *   withdrawals.ts (ต่อไป) → อนุมัติ/ปฏิเสธ/บันทึกโอน
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
  actorId: ID;
  action: string;
  targetId?: ID;
  detail?: string;
}): AuditLog {
  const log: AuditLog = { ...input, id: generateId("log"), createdAt: nowISO() };
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
