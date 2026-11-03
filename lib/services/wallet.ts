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
import { notImplemented } from "./_todo";

export function getBalance(userId: ID): number {
  void userId;
  return notImplemented("getBalance");
}

/** Customer เติมผ่าน QR (จำลองชำระสำเร็จแล้วค่อยเรียก) */
export function topupOnline(customerId: ID, amount: number): TokenTransaction {
  void customerId;
  void amount;
  return notImplemented("topupOnline");
}

/** Admin เติมหน้างานให้ Customer (ค้นหาด้วย Customer ID) */
export function topupOnsite(input: {
  customerId: ID;
  amount: number;
  channel: "onsite_cash" | "onsite_qr";
  adminId: ID;
}): TokenTransaction {
  void input;
  return notImplemented("topupOnsite");
}

/** Customer จ่าย Token ให้ร้าน — ต้องเช็กยอดคงเหลือก่อน */
export function pay(input: {
  customerId: ID;
  vendorId: ID;
  vendorUserId: ID;
  amount: number;
  note?: string;
}): { ok: true; tx: TokenTransaction } | { ok: false; reason: string } {
  void input;
  return notImplemented("pay");
}

/** หัก Token ของร้านเมื่อ Admin บันทึกว่าโอนเงินแล้ว */
export function recordWithdrawal(input: {
  vendorUserId: ID;
  vendorId: ID;
  amount: number;
  withdrawalId: ID;
  adminId: ID;
}): TokenTransaction {
  void input;
  return notImplemented("recordWithdrawal");
}

export function listTransactions(userId?: ID): TokenTransaction[] {
  void userId;
  return notImplemented("listTransactions");
}
