"use client";

/**
 * lib/auth.tsx — ระบบเข้าสู่ระบบ (จำลองด้วย localStorage)
 * เจ้าของ: ทิวากร (Customer)
 *
 * ข้อมูลที่ไฟล์นี้ดูแล: session — หน้าเว็บห้ามเขียนเอง ให้เรียกผ่าน useAuth()
 *
 * ทำไมไม่มี AuthProvider
 *   useStore ทำให้ทุกหน้าเห็นข้อมูลล่าสุดอยู่แล้ว จึงไม่ต้องสร้าง Provider เพิ่ม
 *
 * TODO:
 * - เพิ่ม login(email, password) และ logout() ใน useAuth()
 * - หลัง login พาไปหน้าตาม role: /customer, /organizer, /vendor, /admin
 * - บัญชีที่ status = "suspended" ห้ามเข้าสู่ระบบ
 * - ใช้ useAuth ใน components/shared/RoleShell.tsx
 */

import { registerCustomer } from "./services/users";
import { writeStore } from "./storage";
import { useStore } from "./useStore";

/** ข้อมูลที่ต้องกรอกตอนสมัครสมาชิก */
interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
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

/** useAuth — คืนผู้ใช้ที่ล็อกอินอยู่ (ถ้ายังไม่ล็อกอินจะเป็น null) และฟังก์ชัน register */
export function useAuth() {
  const session = useStore("session");
  const users = useStore("users");

  let user = null;
  if (session) {
    user = users.find((u) => u.id === session.userId) ?? null;
  }

  return { user, register };
}
