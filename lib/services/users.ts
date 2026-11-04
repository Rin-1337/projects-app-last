/**
 * ═══════════════════════════════════════════════════════════════════════
 * lib/services/users.ts — จัดการบัญชีผู้ใช้
 * เจ้าของ: นัฐวิ (เซน) · Admin
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ไฟล์นี้ทำอะไร
 *   ค้นหาผู้ใช้ · ลูกค้าสมัครสมาชิก · Admin สร้างบัญชี Organizer/Vendor · ระงับ/เปิดใช้บัญชี
 *
 * ข้อมูลที่ไฟล์นี้ดูแล
 *   users  [{ id, role, name, email, password, customerCode?, status, ... }]
 *
 * ใครเรียกใช้ไฟล์นี้
 *   lib/auth.tsx (ปอ)          → findUserByEmail() ตอน login, registerCustomer() ตอนสมัคร
 *   หน้า /admin/users          → createStaffAccount(), setUserStatus()
 *   หน้า /admin/topup          → findCustomerByCode()
 *   vendors.ts                 → getUser() (เช็กว่าบัญชีเป็น Vendor), findCustomerByCode() (ร้านสแกน QR ลูกค้า)
 *
 * กติกาบัญชีตาม requirement
 *   - Customer สมัครเองได้ → registerCustomer
 *   - Organizer / Vendor ต้องให้ Admin สร้างให้ → createStaffAccount
 *   - Admin ใช้บัญชีที่กำหนดไว้ (อยู่ใน seed.ts) สร้างจากหน้าเว็บไม่ได้
 *
 * หลักการออกแบบ (คำถามที่อาจารย์น่าจะถาม)
 *   ถาม: ทำไมฟังก์ชันที่ผู้ใช้กรอกผิดได้ (สมัคร/สร้างบัญชี) คืน { ok, reason }
 *        แต่ setUserStatus ใช้ throw
 *   ตอบ: อีเมลซ้ำ / รหัสสั้น เป็นเรื่องปกติที่ผู้ใช้ทำผิดได้ หน้าเว็บต้องแสดงเหตุผล
 *        ส่วน setUserStatus ถูกเรียกจากปุ่มในตารางผู้ใช้ที่มีอยู่จริง
 *        ถ้าหาไม่เจอแปลว่าโค้ดผิด (บั๊ก) จึง throw
 *
 *   ถาม: เก็บรหัสผ่านเป็นข้อความธรรมดา ปลอดภัยไหม
 *   ตอบ: ไม่ปลอดภัย แต่นี่เป็น Frontend Prototype ตาม README (ไม่มี backend)
 *        ระบบจริงต้อง hash รหัสผ่าน (เช่น bcrypt) และตรวจที่ server
 */

import type { ID, Role, User } from "../types";
import { generateId, nowISO, readStore, updateStore } from "../storage";
import { logAction } from "./audit";

/* ═══════════════════════ ฟังก์ชันช่วย (ใช้ภายในไฟล์นี้เท่านั้น) ═══════════════════════ */

/**
 * normalizeEmail — ทำอีเมลให้เป็นรูปแบบเดียวกันก่อนเก็บหรือเทียบ
 *   " Somying@Test.com " → "somying@test.com"
 *
 * ทำไมต้องมี
 *   ผู้ใช้อาจพิมพ์ Somying@test.com ตอนสมัคร แต่พิมพ์ somying@test.com ตอนล็อกอิน
 *   หรือเผลอเว้นวรรคตอนวาง ถ้าไม่ทำให้เหมือนกันก่อน จะล็อกอินไม่ได้ ทั้งที่เป็นอีเมลเดียวกัน
 *   .trim()        ตัดช่องว่างหน้าและหลัง
 *   .toLowerCase() แปลงเป็นตัวพิมพ์เล็กทั้งหมด (อีเมลไม่สนตัวพิมพ์เล็ก-ใหญ่)
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * nextCustomerCode — ออก Customer ID ถัดไป เช่น มี C0001, C0003 → ได้ C0004
 *
 * ขั้นตอน
 *   1. วนผู้ใช้ทีละคน (for...of อ่านง่ายเมื่อต้องจำค่าข้ามรอบ คือ max)
 *   2. ถ้ามี customerCode → ตัดตัว C ออก ("C0003".slice(1) = "0003") → แปลงเป็นเลข 3
 *   3. จำค่าที่มากที่สุดไว้
 *   4. คืน "C" + (max + 1) เติม 0 ข้างหน้าให้ครบ 4 หลัก (padStart(4, "0") → "0004")
 *
 * ทำไมหาค่าสูงสุด +1 ไม่ใช้ "นับจำนวนลูกค้า +1"
 *   ถ้าวันหลังมีการลบลูกค้า การนับจำนวนอาจได้รหัสซ้ำกับคนที่ยังอยู่
 *   ค่าสูงสุด +1 ไม่มีวันซ้ำ
 * ทำไมใช้ let ไม่ใช่ const: ค่า max เปลี่ยนระหว่างวน (const เปลี่ยนค่าไม่ได้)
 * ทำไมรหัสขึ้นต้นด้วย C และมี 4 หลัก: สั้น อ่านออกเสียงบอก Admin หน้างานได้ง่าย
 */
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

/**
 * validateAccount — ตรวจข้อมูลบัญชีใหม่
 * คืน: null = ผ่าน, ข้อความ = ไม่ผ่าน (เหตุผล)
 *
 * ใช้ร่วมกันใน registerCustomer และ createStaffAccount (หลัก DRY)
 * ตรวจทีละข้อ เจอข้อแรกที่ผิดก็คืนทันที → ผู้ใช้เห็นข้อความทีละข้อ อ่านง่าย
 *
 * ทำไมรหัสผ่านขั้นต่ำ 4 ตัว: บัญชีทดลองใช้ "1234" ถ้าตั้ง 8 ตัวจะขัดกับข้อมูลทดลอง
 * ทำไมเช็กอีเมลแค่มี @: พอสำหรับ prototype ช่องกรอกหน้าเว็บใช้ type="email" ช่วยอีกชั้น
 * if (...) return ...;  บรรทัดเดียวไม่มีปีกกา เขียนได้เมื่อมีคำสั่งเดียว ทำให้รายการตรวจสั้น
 */
function validateAccount(name: string, email: string, password: string): string | null {
  if (!name) return "กรุณากรอกชื่อ";
  if (!email.includes("@")) return "รูปแบบอีเมลไม่ถูกต้อง";
  if (password.length < 4) return "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";
  if (findUserByEmail(email)) return "อีเมลนี้มีผู้ใช้แล้ว";
  return null;
}

/* ═══════════════════════ ค้นหาผู้ใช้ ═══════════════════════ */

/**
 * listUsers — รายชื่อผู้ใช้ทั้งหมด หรือเฉพาะ role ที่ระบุ
 * ใครเรียก: หน้า /admin/users, หน้า /admin/vendors (เลือกบัญชี Vendor มาสร้างร้าน)
 * role?  ไม่ส่ง = ทั้งหมด, ส่ง "vendor" = เฉพาะร้าน (โครงเดียวกับ listTransactions)
 */
export function listUsers(role?: Role): User[] {
  const users = readStore("users");
  if (!role) {
    return users;
  }
  return users.filter((u) => u.role === role);
}

/**
 * getUser — หาผู้ใช้จาก id
 * คืน: User | undefined → อาจไม่เจอ คนเรียกต้องเช็กก่อนใช้
 * เขียนบรรทัดเดียวได้เพราะ readStore คืน array → ต่อ .find ได้ทันที
 */
export function getUser(userId: ID): User | undefined {
  return readStore("users").find((u) => u.id === userId);
}

/**
 * findUserByEmail — หาผู้ใช้จากอีเมล (ไม่สนตัวพิมพ์เล็ก-ใหญ่ / ช่องว่าง)
 * ใครเรียก: auth.tsx ตอน login, validateAccount (เช็กอีเมลซ้ำ)
 * ทำให้ทั้ง "อีเมลที่พิมพ์มา" และ "อีเมลที่เก็บไว้" เป็นรูปแบบเดียวกันก่อนเทียบ
 */
export function findUserByEmail(email: string): User | undefined {
  const target = normalizeEmail(email);
  return readStore("users").find((u) => normalizeEmail(u.email) === target);
}

/**
 * findCustomerByCode — หาลูกค้าจาก Customer ID เช่น "C0001" หรือ " c0001"
 * ใครเรียก: หน้า /admin/topup (Admin พิมพ์รหัสที่ลูกค้าบอก),
 *           sellToCustomer ใน vendors.ts (ร้านสแกน QR ของลูกค้า ซึ่งก็คือ Customer ID)
 *
 * .toUpperCase()  รหัสเก็บเป็นตัวใหญ่ → พิมพ์ตัวเล็กก็ยังหาเจอ
 * &&              "และ" — ต้องเป็น customer และรหัสตรง กันไปเจอบัญชี role อื่น
 */
export function findCustomerByCode(code: string): User | undefined {
  const target = code.trim().toUpperCase();
  return readStore("users").find(
    (u) => u.role === "customer" && u.customerCode === target,
  );
}

/* ═══════════════════════ สร้างบัญชี ═══════════════════════ */

/**
 * registerCustomer — ลูกค้าสมัครสมาชิกเอง
 *
 * รับ:  { name, email, password, phone? }
 * คืน:  { ok: true, user } | { ok: false, reason }
 * ใครเรียก: หน้า /register ผ่าน auth.tsx (ปอ)
 *
 * ขั้นตอน: จัดรูปแบบชื่อ/อีเมล → ตรวจข้อมูล → สร้าง user พร้อม Customer ID → บันทึก
 *
 * จุดที่ควรรู้
 *   phone: input.phone?.trim() || undefined
 *     ถ้าไม่ส่งเบอร์ หรือส่งมาเป็นช่องว่าง → เก็บ undefined แทน "" (ไม่มีข้อมูล = ไม่มีช่อง)
 *   status: "active"  สมัครแล้วใช้งานได้ทันที
 *   ไม่สร้างกระเป๋า Token
 *     getBalance คืน 0 ถ้ายังไม่มีกระเป๋า และ changeBalance สร้างให้ตอนเติมครั้งแรก
 *     users.ts จึงไม่ต้องไปเขียนข้อมูล wallets ซึ่งเป็นของ wallet.ts (แยกหน้าที่ชัด)
 *   ไม่บันทึก Audit Log เพราะผู้ทำคือลูกค้า ไม่ใช่ Admin
 */
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
  // [...users, user] = คัดลอกผู้ใช้เดิมทั้งหมด แล้วต่อท้ายด้วยคนใหม่
  updateStore("users", (users) => [...users, user]);
  return { ok: true, user };
}

/**
 * createStaffAccount — Admin สร้างบัญชี Organizer / Vendor
 *
 * รับ:  { role, name, email, password, adminId }
 * คืน:  { ok: true, user } | { ok: false, reason }
 * ใครเรียก: ฟอร์มในหน้า /admin/users
 *
 * ต่างจาก registerCustomer 3 จุด
 *   1. role มาจาก Admin เลือก — type "organizer" | "vendor" กันสร้าง Admin/Customer จากทางนี้
 *   2. ไม่มี customerCode (ใช้เฉพาะลูกค้า)
 *   3. บันทึก Audit Log ว่า Admin คนไหนสร้างบัญชีใคร
 *
 * ทำไมเรียก logAction หลัง updateStore
 *   บันทึก log เฉพาะเมื่อสร้างสำเร็จจริง ถ้าข้อมูลไม่ผ่านจะ return ไปก่อน ไม่มี log ปลอม
 *
 * หลังสร้างบัญชี Vendor แล้ว Admin ต้องไปสร้าง "ร้าน" ต่อที่ /admin/vendors (createVendor)
 */
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

/* ═══════════════════════ แก้สถานะบัญชี ═══════════════════════ */

/**
 * setUserStatus — Admin ระงับหรือเปิดใช้บัญชี
 *
 * รับ:  userId, status ("active" | "suspended"), adminId
 * คืน:  ผู้ใช้หลังแก้
 * ใครเรียก: ปุ่ม "ระงับ / เปิดใช้งาน" ในตารางหน้า /admin/users
 *
 * User["status"]  ดึง type ของช่อง status จาก User โดยตรง
 *                 ถ้าวันหลังเพิ่มสถานะใหม่ใน types.ts ฟังก์ชันนี้รองรับเองไม่ต้องแก้
 *
 * กันระงับ Admin: ถ้า Admin เผลอระงับตัวเอง จะไม่มีใครเข้าระบบมาแก้ได้อีก
 *                 (หน้าเว็บซ่อนปุ่มไว้แล้ว แต่กันซ้ำที่นี่อีกชั้น เผื่อมีหน้าอื่นเรียก)
 *
 * { ...user, status }  คัดลอกทุกช่องของ user แล้วเปลี่ยนเฉพาะ status
 * .map(... ? updated : u)  แทนที่เฉพาะคนนี้ ท่าเดียวกับ changeBalance
 * action: เลือกชื่อตามสถานะใหม่ → อ่าน Audit Log แล้วรู้ทันทีว่าระงับหรือเปิด
 *
 * บัญชีที่ถูกระงับ: auth.tsx (ปอ) ต้องไม่ให้ล็อกอิน
 */
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
