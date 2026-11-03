/**
 * lib/services/withdrawals.ts — คำขอถอนเงินของ Vendor
 * เจ้าของ: สุรัมภา (ฝั่งสร้างคำขอ) + นัฐวิ (ฝั่งอนุมัติ)
 * ข้อมูลที่ดูแล: withdrawals
 *
 * Flow: pending → approved → transferred   หรือ   pending → rejected
 * ตอน transferred ให้เรียก wallet.recordWithdrawal() เพื่อหัก Token ของ Vendor
 */
import type { ID, Withdrawal } from "../types";
import { notImplemented } from "./_todo";

/* ── ฝั่ง Vendor (สุรัมภา) ── */

/** ต้องเช็กว่ายอด Token ของร้านพอ และไม่มีคำขอ pending ค้างเกินยอด */
export function requestWithdrawal(input: {
  vendorId: ID;
  amount: number;
  bankAccountId: ID;
}): Withdrawal {
  void input;
  return notImplemented("requestWithdrawal");
}

export function listWithdrawalsByVendor(vendorId: ID): Withdrawal[] {
  void vendorId;
  return notImplemented("listWithdrawalsByVendor");
}

/* ── ฝั่ง Admin (นัฐวิ) ── */

export function listPendingWithdrawals(): Withdrawal[] {
  return notImplemented("listPendingWithdrawals");
}

export function approveWithdrawal(withdrawalId: ID, adminId: ID): Withdrawal {
  void withdrawalId;
  void adminId;
  return notImplemented("approveWithdrawal");
}

export function rejectWithdrawal(
  withdrawalId: ID,
  adminId: ID,
  reason: string,
): Withdrawal {
  void withdrawalId;
  void adminId;
  void reason;
  return notImplemented("rejectWithdrawal");
}

export function markTransferred(
  withdrawalId: ID,
  adminId: ID,
  transferRef: string,
): Withdrawal {
  void withdrawalId;
  void adminId;
  void transferRef;
  return notImplemented("markTransferred");
}
