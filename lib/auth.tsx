"use client";

/**
 * lib/auth.tsx — ระบบเข้าสู่ระบบ (จำลองด้วย localStorage)
 * เจ้าของ: ทิวากร (Customer)
 *
 * ข้อมูลที่ไฟล์นี้ดูแล: session — หน้าเว็บห้ามเขียนเอง ให้เรียกผ่าน useAuth()
 * นอกจากนี้ยังแก้ชื่อ / เบอร์โทร / รหัสผ่าน ของผู้ใช้ใน users ด้วย (หน้า /customer/profile)
 *
 * วิธีใช้ในหน้าเว็บ
 *   const { user, login, logout, updateProfile, changePassword } = useAuth();
 *
 * ทำไมไม่มี AuthProvider
 *   useStore ทำให้ทุกหน้าเห็นข้อมูลล่าสุดอยู่แล้ว จึงไม่ต้องสร้าง Provider เพิ่ม
 */

import { findUserByEmail, registerCustomer } from "./services/users";
import { readStore, updateStore, writeStore } from "./storage";
import type { Role, Session, User } from "./types";
import { useStore } from "./useStore";

/** หน้าหลักของแต่ละ Role — login สำเร็จแล้วจะพาไปหน้านี้ (ลูกค้าใช้หน้าแรกเป็นหน้าหลัก) */
export const ROLE_HOME: Record<Role, string> = {
  customer: "/",
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

/** ผลของการแก้ข้อมูล: สำเร็จ หรือไม่สำเร็จพร้อมเหตุผล */
type UpdateResult = { ok: true } | { ok: false; reason: string };

/**
 * updateProfile — แก้ชื่อและเบอร์โทรของผู้ใช้ที่ล็อกอินอยู่
 * อีเมลแก้ไม่ได้ เพราะใช้เป็นชื่อสำหรับล็อกอิน
 */
function updateProfile(userId: string, name: string, phone: string): UpdateResult {
  const newName = name.trim();
  const newPhone = phone.trim();

  if (newName === "") {
    return { ok: false, reason: "กรุณากรอกชื่อ" };
  }
  // เบอร์โทรไม่บังคับ แต่ถ้ากรอกต้องเป็นตัวเลข 9-10 หลัก (กติกาเดียวกับฟอร์มที่อยู่จัดส่ง)
  if (newPhone !== "" && !/^[0-9]{9,10}$/.test(newPhone)) {
    return { ok: false, reason: "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก" };
  }

  // ไม่กรอกเบอร์ = เก็บเป็น undefined (เหมือนตอนสมัครสมาชิก)
  let phoneToSave: string | undefined = undefined;
  if (newPhone !== "") {
    phoneToSave = newPhone;
  }

  // แก้เฉพาะคนนี้ คนอื่นคงเดิม
  updateStore("users", (users) =>
    users.map((u) => {
      if (u.id !== userId) {
        return u;
      }
      return { ...u, name: newName, phone: phoneToSave };
    }),
  );
  return { ok: true };
}

/**
 * changePassword — เปลี่ยนรหัสผ่าน
 * ต้องกรอกรหัสเดิมให้ถูกก่อน กันคนอื่นแอบเปลี่ยนตอนเราลืมออกจากระบบ
 */
function changePassword(userId: string, currentPassword: string, newPassword: string): UpdateResult {
  const user = readStore("users").find((u) => u.id === userId);
  if (!user) {
    return { ok: false, reason: "ไม่พบผู้ใช้" };
  }
  if (user.password !== currentPassword) {
    return { ok: false, reason: "รหัสผ่านเดิมไม่ถูกต้อง" };
  }
  // ขั้นต่ำ 4 ตัว เท่ากับตอนสมัครสมาชิก (validateAccount ใน users.ts)
  if (newPassword.length < 4) {
    return { ok: false, reason: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" };
  }

  updateStore("users", (users) =>
    users.map((u) => {
      if (u.id !== userId) {
        return u;
      }
      return { ...u, password: newPassword };
    }),
  );
  return { ok: true };
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

/** useAuth — ผู้ใช้ที่ล็อกอินอยู่ (ยังไม่ล็อกอินจะเป็น null) และฟังก์ชัน login, logout, register, updateProfile, changePassword */
export function useAuth() {
  const session = useStore("session");
  const users = useStore("users");
  const user = findLoggedInUser(session, users);

  return { user, login, logout, register, updateProfile, changePassword };
}
