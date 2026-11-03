/**
 * lib/services/audit.ts — บันทึกการทำงานของผู้ดูแลระบบ
 * เจ้าของ: นัฐวิ (Admin)
 * ข้อมูลที่ดูแล: auditLogs
 */
import type { AuditLog, ID } from "../types";
import { generateId, nowISO, readStore, updateStore } from "../storage";

// บันทึกว่า Admin คนไหนทำอะไร กับอะไร
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

// ประวัติทั้งหมด (ใหม่ → เก่า)
export function listAuditLogs(): AuditLog[] {
  return readStore("auditLogs");
}

// โครงเดียวกับ addTransaction ใน wallet.ts: รับข้อมูลมา เติม id กับเวลา แล้วใส่ไว้หน้าสุด
// { ...input, id, createdAt }: คัดลอกทุกช่องจาก input (actorId, action, targetId, detail) แล้วเพิ่มอีก 2 ช่อง
// action ตั้งชื่อแบบ "สิ่งของ.การกระทำ" เช่น "user.create", "user.suspend", "wallet.topup", "withdrawal.approve" หน้า Audit Logs จะกรองหรือแปลเป็นภาษาไทยได้ง่าย
// ไม่มี notImplemented แล้ว: ไฟล์นี้จึงไม่ต้อง import _todo
// ต่างจาก wallet.ts ตรงไหน: logAction มี export เพราะไฟล์อื่น (เช่น users.ts, wallet.ts, withdrawals.ts) ต้องเรียกใช้ ส่วน addTransaction เป็นของใช้ภายใน wallet.ts เท่านั้น