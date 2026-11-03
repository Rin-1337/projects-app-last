/**
 * lib/services/users.ts — จัดการบัญชีผู้ใช้
 * เจ้าของ: นัฐวิ (Admin)
 * ข้อมูลที่ดูแล: users
 *
 * ทิวากร (auth) เรียก findUserByEmail / registerCustomer
 */
import type { ID, Role, User } from "../types";
import { generateId, nowISO, readStore, updateStore } from "../storage";
import { logAction } from "./audit";

// ตัดช่องว่างหน้า-หลัง และทำเป้นตัวพิมพ์เล็ก เช่น " Somying@Test.com " → "somying@test.com"
// ทำไมต้องมี: ผู้ใช้อาจพิมพ์ Somying@test.com ตอนสมัคร แต่พิมพ์ somying@test.com ตอนล็อกอิน ถ้าไม่ทำให้เหมือนกันก่อนเทียบ จะล็อกอินไม่ได้ ทั้งที่เป็นอีเมลเดียวกัน
// .trim() ตัดช่องว่างหน้าและหลัง (เผลอเว้นวรรคตอนวางอีเมล)
// .toLowerCase() แปลงเป็นตัวพิมพ์เล็กทั้งหมด
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// หารหัสลูกค้าที่มากที่สุดแล้ว +1 เช่น มี C0001, C0003 → คืน C0004
// for (const u of users): วนทีละคน อ่านง่ายกว่า .map/.filter เมื่อต้องจำค่าข้ามรอบ (ในที่นี้คือ max)
// let max = 0: ใช้ let เพราะค่าจะเปลี่ยนระหว่างวน ส่วน const เปลี่ยนค่าไม่ได้
// "C0003".slice(1): ตัดตัวแรกทิ้ง ได้ "0003" แล้ว Number(...) แปลงเป็นเลข 3
// String(4).padStart(4, "0"): เติม 0 ข้างหน้าจนครบ 4 หลัก ได้ "0004"
// ทำไมหาค่าสูงสุด ไม่ใช้นับจำนวนคน: ถ้าวันหลังมีการลบลูกค้า การนับจำนวนอาจได้รหัสซ้ำกับคนที่มีอยู่ ส่วนค่าสูงสุด +1 ไม่มีวันซ้ำ
function nextCustomerCode(users: User[]): string {
  let max = 0;
  for (const u of users) {
    if (u.customerCode) {
      const n = Number(u.customerCode.slice(1));
      if (n > max) {
        max = n;
      }
    }
  }
  return "C" + String(max + 1).padStart(4, "0");
}

// ตรวจสอบข้อมูลบัญชีใหม่ - ผ่าน = null, ไม่ผ่าน = ข้อความบอกเหตุผล
// string | null: ถ้าผ่านได้ null (ไม่มีปัญหา) ถ้าไม่ผ่านได้ข้อความบอกเหตุผล
// if (...) return ...; บรรทัดเดียวไม่มีปีกกา: เขียนแบบนี้ได้ถ้าข้างในมีคำสั่งเดียว ช่วยให้รายการตรวจสั้นและอ่านง่าย
function validateAccount(name: string, email: string, password: string): string | null {
  if (!name) return "กรุณากรอกชื่อ";
  if (!email.includes("@")) return "รูปแบบอีเมลไม่ถูกต้อง";
  if (password.length < 4) return "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";
  if (findUserByEmail(email)) return "อีเมลนี้มีผู้ใช้แล้ว";
  return null;
}

// รายชื่อผู้ใช้ทั้งหมด หรือเฉพาะ role ที่ระบุ
// โครงเดียวกับ listTransactions เลย: ไม่ส่ง role มาก็คืนทั้งหมด ส่ง "vendor" มาก็คืนเฉพาะร้าน
export function listUsers(role?: Role): User[] {
  const users = readStore("users");
  if (!role) {
    return users;
  }
  return users.filter((u) => u.role === role);
}

// หาผู้ใช้จาก id (ไม่เจอ = undefined)
// User | undefined: อาจได้ผู้ใช้ หรือไม่เจอก็ได้ คนเรียกต้องเช็กเองก่อนใช้
// เขียนบรรทัดเดียว: readStore แล้วต่อ .find ได้ทันที ไม่ต้องเก็บใส่ตัวแปรก่อน
export function getUser(userId: ID): User | undefined {
  return readStore("users").find((u) => u.id === userId);
}

// หาผู้ใช้จากอีเมล (ไม่สนตัวพิมพ์เล็ก-ใหญ่)
// ทำให้ทั้งอีเมลที่พิมพ์มาและอีเมลที่เก็บไว้เป็นรูปแบบเดียวกันก่อนเทียบ
export function findUserByEmail(email: string): User | undefined {
  const target = normalizeEmail(email);
  return readStore("users").find((u) => normalizeEmail(u.email) === target);
}

/** ค้นหาด้วย Customer ID เช่น "C0001" (หน้าเติม Token หน้างาน) */
// .toUpperCase(): รหัสเก็บเป็นตัวใหญ่ (C0001) ถ้า Admin พิมพ์ c0001 ก็ยังหาเจอ
// && คือ "และ": ต้องเป็น customer และรหัสตรงกัน กันไม่ให้ไปเจอบัญชี role อื่น
export function findCustomerByCode(code: string): User | undefined {
  const target = code.trim().toUpperCase();
  return readStore("users").find(
    (u) => u.role === "customer" && u.customerCode === target,
  );
}

/** Customer สมัครเอง → ออก customerCode ให้อัตโนมัติ */
// ทำไมคืน { ok, … } แทน throw: ใช้หลักเดียวกับ pay อีเมลซ้ำหรือกรอกไม่ครบเป็นเรื่องปกติที่ผู้ใช้ทำผิดได้ หน้าสมัครของปอต้องแสดง reason ให้ผู้ใช้เห็น
// ⚠️ เปลี่ยน type ที่คืนค่า: ใน stub เดิมคืน User แต่ตอนนี้คืน { ok, user } แทน ตอนเปิด PR ต้องเขียนบอกปอด้วย
// ตรวจทีละเงื่อนไข เจอข้อแรกที่ผิดก็คืนทันที: ผู้ใช้จะเห็นข้อความทีละข้อ และโค้ดอ่านง่าย ไม่ต้องซ้อน if หลายชั้น
// if (findUserByEmail(email)): ถ้าเจอผู้ใช้ (ได้ object) จะเป็นจริง แปลว่าอีเมลซ้ำ เรียกใช้ฟังก์ชันที่เพิ่งเขียนในรอบ 1 ได้เลย
// รหัสผ่านอย่างน้อย 4 ตัว: เพราะบัญชีทดลองใช้ 1234 ถ้าตั้งเป็น 8 ตัว จะสวนกับข้อมูลทดลอง
// input.phone?.trim() || undefined: ถ้าไม่ได้ส่งเบอร์มา หรือส่งมาเป็นช่องว่าง ให้เป็น undefined แทนที่จะเก็บ "" ไว้
// ไม่ต้องสร้างกระเป๋า Token: getBalance คืน 0 ถ้ายังไม่มีกระเป๋า และ changeBalance สร้างให้เองตอนเติมครั้งแรก ไฟล์ users.ts จึงไม่ต้องไปยุ่งกับข้อมูล wallets 
// ซึ่งเป็นของ wallet.ts ถ้า stub เดิมมีคอมเมนต์ว่า "สร้าง wallet ยอด 0" ให้ลบส่วนนั้นออก
export function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): { ok: true; user: User } | { ok: false; reason: string } {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  const error = validateAccount(name, email, input.password);
  if(error) {
    return { ok: false, reason: error };
  }

  const user: User = {
    id: generateId("u"),
    role: "customer",
    name,
    email,
    password: input.password,
    phone: input.phone?.trim() || undefined,
    customerCode: nextCustomerCode(readStore("users")),
    status: "active",
    createdAt: nowISO(),
  };
  updateStore("users", (users) => [...users, user]);
  return { ok: true, user };
}

/** Admin สร้างบัญชี Organizer / Vendor */
// ต่างจาก registerCustomer แค่ 3 จุด: role มาจาก Admin เลือก · ไม่มี customerCode (ใช้เฉพาะลูกค้า) · บันทึก Audit Log
// role: "organizer" | "vendor": Admin สร้างบัญชี Admin หรือ Customer จากฟังก์ชันนี้ไม่ได้ TypeScript จะขีดแดงทันทีถ้าส่ง role อื่นมา
// เรียก logAction หลังบันทึกผู้ใช้สำเร็จแล้วเท่านั้น: ถ้าข้อมูลไม่ผ่าน จะ return ไปก่อน ไม่มี log ที่ไม่เกิดขึ้นจริง
export function createStaffAccount(input: {
  role: "organizer" | "vendor";
  name: string;
  email: string;
  password: string;
  adminId: ID;
}): { ok: true; user: User} | { ok: false; reason: string} {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  const error = validateAccount(name, email, input.password);
  if (error) {
    return { ok: false, reason: error };
  }

  const user: User = {
    id: generateId("u"),
    role: input.role,
    name,
    email,
    password: input.password,
    status: "active",
    createdAt: nowISO(),
  };
  updateStore("users", (users) => [...users, user]);

  logAction({
    actorId: input.adminId,
    action: "user.create",
    targetId: user.id,
    detail: `สร้างบัญชี ${input.role}: ${email}`,
  });
  return { ok: true, user};
}

// Admin ระงับหรือเปิดใช้บัญชี (บัญชีที่ถูกระงับจะล็อกอินไม่ได้)
// User["status"]: ดึง type ของช่อง status มาจาก User โดยตรง ได้ "active" | "suspended" ถ้าวันหลังเพิ่มสถานะใหม่ใน types.ts ฟังก์ชันนี้จะรองรับเองโดยไม่ต้องแก้
// ทำไมกรณีนี้ใช้ throw: ปุ่มระงับอยู่ในตารางรายชื่อผู้ใช้ที่มีอยู่จริง ถ้าหาไม่เจอแสดงว่าโค้ดผิด ไม่ใช่ผู้ใช้กรอกผิด
// กันระงับ Admin: ถ้า Admin เผลอระงับตัวเอง จะไม่มีใครเข้าระบบมาแก้ได้อีก
// .map(... ? updated : u): แทนที่เฉพาะผู้ใช้คนนั้น เป็นท่าเดียวกับ changeBalance
// action: status === "suspended" ? ... : ...: เลือกชื่อ action ตามสถานะใหม่
export function setUserStatus(
  userId: ID,
  status: User["status"],
  adminId: ID,
): User {
  const user = getUser(userId);
  if (!user) {
    throw new Error("ไม่พบผู้ใช้");
  }
  if (user.role === "admin") {
    throw new Error("ระงับบัญชี Admin ไม่ได้")
  }

  const updated: User = { ...user, status };
  updateStore("users", (users) => users.map((u) => (u.id === userId ? updated : u )));

  logAction({
    actorId: adminId,
    action: status === "suspended" ? "user.suspend" : "user.activate",
    targetId: userId,
    detail: user.email,
  });
  return updated
}
