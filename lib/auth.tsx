"use client";

/**
 * lib/auth.tsx — ระบบเข้าสู่ระบบ (จำลองด้วย localStorage)
 * เจ้าของ: ทิวากร (Customer)
 *
 * ข้อมูลที่ไฟล์นี้ดูแล: session — หน้าเว็บห้ามเขียนเอง ให้เรียกผ่าน useAuth()
 *
 * วิธีใช้ในหน้าเว็บ
 *   const { user, login, logout } = useAuth();
 *
 * ทำไมไม่มี AuthProvider
 *   useStore ทำให้ทุกหน้าเห็นข้อมูลล่าสุดอยู่แล้ว จึงไม่ต้องสร้าง Provider เพิ่ม
 */

import { findUserByEmail, registerCustomer } from "./services/users";
import { readStore, writeStore } from "./storage";
import type { Role, Session, User } from "./types";
import { useStore } from "./useStore";

/** หน้าแรกของแต่ละ Role — login สำเร็จแล้วจะพาไปหน้านี้ */
export const ROLE_HOME: Record<Role, string> = {
  customer: "/customer",
  organizer: "/organizer",
  vendor: "/vendor",
  admin: "/admin",
};

/** ข้อมูลที่ต้องกรอกตอนสมัครสมาชิก */
interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

/** ผลของการ login: สำเร็จจะได้ user ไม่สำเร็จจะได้เหตุผลใน reason */
type LoginResult = { ok: true; user: User } | { ok: false; reason: string };

/** login — เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน */
function login(email: string, password: string): LoginResult {
  const user = findUserByEmail(email);

  // ใช้ข้อความเดียวกันทั้งสองกรณี จะได้ไม่บอกใบ้ว่าอีเมลนี้มีในระบบหรือไม่
  if (!user || user.password !== password) {
    return { ok: false, reason: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  if (user.status === "suspended") {
    return { ok: false, reason: "บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ" };
  }

  // จำไว้ว่าใครล็อกอินอยู่
  writeStore("session", { userId: user.id, role: user.role });
  return { ok: true, user };
}

/** logout — ออกจากระบบ (RoleGuard จะพากลับไปหน้า login เอง) */
function logout() {
  writeStore("session", null);
}

/**
 * register — สมัครสมาชิกแล้วเข้าสู่ระบบให้ทันที
 * ผลลัพธ์มี result.ok บอกว่าสำเร็จไหม ถ้าไม่สำเร็จจะมีเหตุผลใน result.reason
 */
function register(input: RegisterInput) {
  const result = registerCustomer(input);

  if (result.ok) {
    // จำไว้ว่าใครล็อกอินอยู่
    writeStore("session", { userId: result.user.id, role: result.user.role });
  }

  return result;
}

/** หาว่าใครล็อกอินอยู่ ถ้ายังไม่ล็อกอิน หรือบัญชีถูกระงับ จะได้ null */
function findLoggedInUser(session: Session | null, users: User[]) {
  if (!session) {
    return null;
  }

  const user = users.find((u) => u.id === session.userId);

  // เช็กสถานะด้วย เผื่อ Admin ระงับบัญชีระหว่างที่คนนี้ล็อกอินอยู่
  if (!user || user.status === "suspended") {
    return null;
  }

  return user;
}

/**
 * getCurrentUser — อ่านผู้ใช้ที่ล็อกอินอยู่จาก localStorage ตอนนี้เลย
 * ใช้ใน useEffect หรือตอนกดปุ่ม ส่วนการแสดงผลบนหน้าเว็บให้ใช้ user จาก useAuth()
 */
export function getCurrentUser() {
  return findLoggedInUser(readStore("session"), readStore("users"));
}

/** useAuth — ผู้ใช้ที่ล็อกอินอยู่ (ยังไม่ล็อกอินจะเป็น null) และฟังก์ชัน login, logout, register */
export function useAuth() {
  const session = useStore("session");
  const users = useStore("users");
  const user = findLoggedInUser(session, users);

  return { user, login, logout, register };
}
