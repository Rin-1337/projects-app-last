/**
 * lib/services/users.ts — จัดการบัญชีผู้ใช้
 * เจ้าของ: นัฐวิ (Admin)
 * ข้อมูลที่ดูแล: users
 *
 * ทิวากร (auth) เรียก findUserByEmail / registerCustomer
 */
import type { ID, Role, User } from "../types";
import { notImplemented } from "./_todo";

export function listUsers(role?: Role): User[] {
  void role;
  return notImplemented("listUsers");
}

export function getUser(userId: ID): User | undefined {
  void userId;
  return notImplemented("getUser");
}

export function findUserByEmail(email: string): User | undefined {
  void email;
  return notImplemented("findUserByEmail");
}

/** ค้นหาด้วย Customer ID เช่น "C0001" (หน้าเติม Token หน้างาน) */
export function findCustomerByCode(code: string): User | undefined {
  void code;
  return notImplemented("findCustomerByCode");
}

/** Customer สมัครเอง → ออก customerCode + สร้าง wallet ยอด 0 */
export function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): User {
  void input;
  return notImplemented("registerCustomer");
}

/** Admin สร้างบัญชี Organizer / Vendor */
export function createStaffAccount(input: {
  role: "organizer" | "vendor";
  name: string;
  email: string;
  password: string;
  adminId: ID;
}): User {
  void input;
  return notImplemented("createStaffAccount");
}

export function setUserStatus(
  userId: ID,
  status: User["status"],
  adminId: ID,
): User {
  void userId;
  void status;
  void adminId;
  return notImplemented("setUserStatus");
}
