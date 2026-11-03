/**
 * lib/services/audit.ts — บันทึกการทำงานของผู้ดูแลระบบ
 * เจ้าของ: นัฐวิ (Admin)
 * ข้อมูลที่ดูแล: auditLogs
 */
import type { AuditLog, ID } from "../types";
import { notImplemented } from "./_todo";

export function logAction(input: {
  actorId: ID;
  action: string;
  targetId?: ID;
  detail?: string;
}): AuditLog {
  void input;
  return notImplemented("logAction");
}

export function listAuditLogs(): AuditLog[] {
  return notImplemented("listAuditLogs");
}
