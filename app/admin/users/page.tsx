/**
 * หน้า /admin/users — Admin จัดการบัญชีผู้ใช้
 * ผู้รับผิดชอบ: นัฐวิ
 *
 * หน้านี้มี 2 ส่วน
 *   1. ฟอร์มสร้างบัญชี Organizer / Vendor (Customer สมัครเอง Admin จึงไม่ต้องสร้าง)
 *   2. ตารางผู้ใช้ทั้งหมด + ปุ่มกรองตาม Role + ปุ่มระงับ / เปิดใช้งาน
 *
 * หน้านี้ไม่ได้เขียน localStorage เอง ทุกอย่างผ่าน service ใน lib/services/users.ts
 *   - สร้างบัญชี       → createStaffAccount()  (บันทึก Audit Log ให้ด้วย)
 *   - ระงับ / เปิดใช้งาน → setUserStatus()       (บันทึก Audit Log ให้ด้วย)
 */

// ต้องมี "use client" เพราะใช้ useState, useStore และมีการกดปุ่ม (ทำงานในเบราว์เซอร์)
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Card, CardTitle, STATUS_TONE, Input } from "@/components/ui";
import { setUserStatus, createStaffAccount } from "@/lib/services/users";
import type { Role, User } from "@/lib/types";
import { useStore } from "@/lib/useStore";

/* ───────────── ค่าคงที่ (วางนอกฟังก์ชัน) ─────────────
 * ค่าพวกนี้ไม่เปลี่ยน จึงวางไว้นอก AdminUsersPage
 * React จะไม่ต้องสร้างใหม่ทุกครั้งที่หน้าวาดใหม่
 */

// แปลงชื่อ Role เป็นภาษาไทยสำหรับแสดงผล เช่น ROLE_LABEL["vendor"] → "ร้านค้า"
// Record<Role, string> บังคับให้มี key ครบทุก Role
// ถ้าวันหลังเพิ่ม Role ใหม่ใน types.ts แล้วลืมใส่ตรงนี้ TypeScript จะขีดแดงทันที
const ROLE_LABEL: Record<Role, string> = {
  customer: "ผู้เข้าร่วมงาน",
  organizer: "ผู้จัดงาน",
  vendor: "ร้านค้า",
  admin: "ผู้ดูแลระบบ",
};

// รายการปุ่มกรอง — value คือค่าที่เก็บใน state, label คือข้อความบนปุ่ม
// "all" ไม่ใช่ Role จริง จึงต้องเขียน type เป็น Role | "all"
const FILTERS: { value: Role | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "customer", label: "ผู้เข้าร่วมงาน" },
  { value: "organizer", label: "ผู้จัดงาน" },
  { value: "vendor", label: "ร้านค้า" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

export default function AdminUsersPage() {
  // id ของ Admin ที่ล็อกอินอยู่ — ส่งให้ service บันทึกใน Audit Log ว่าใครทำ
  // RoleGuard ใน app/admin/layout.tsx ให้เข้าหน้านี้ได้เฉพาะ Admin จึงมี user เสมอ
  const { user } = useAuth();
  const adminId = user?.id ?? "";

  /* ───────────── ข้อมูลผู้ใช้ ─────────────
   * useStore("users") อ่านผู้ใช้ทั้งหมดจาก localStorage และอัปเดตเอง
   * ทุกครั้งที่ข้อมูลเปลี่ยน → สร้างบัญชีหรือระงับแล้ว ตารางเปลี่ยนทันที
   * ไม่ต้อง setState หรือโหลดใหม่เอง
   */
  const users = useStore("users");

  /* ───────────── state ของตาราง ───────────── */

  // Role ที่เลือกกรองอยู่ ("all" = แสดงทั้งหมด)
  const [filter, setFilter] = useState<Role | "all">("all");

  // ข้อความแดงของตาราง เช่น ระงับไม่สำเร็จ
  const [error, setError] = useState("");

  /* ───────────── state ของฟอร์มสร้างบัญชี ─────────────
   * แต่ละช่องในฟอร์มมี state ของตัวเอง (controlled input)
   */

  // ประเภทบัญชีที่จะสร้าง — สร้างได้แค่ Organizer กับ Vendor
  const [role, setRole] = useState<"organizer" | "vendor">("organizer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ข้อความแดง / เขียวของฟอร์ม — แยกจาก error ของตาราง จะได้แสดงคนละที่
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  /* ───────────── รายชื่อที่จะแสดงในตาราง ─────────────
   * คำนวณจาก users + filter ทุกครั้งที่หน้าวาด
   * ไม่ต้องเก็บเป็น state เพราะคำนวณได้อยู่แล้ว
   * (หลัก: อย่าเก็บ state ซ้ำกับสิ่งที่คำนวณได้ ไม่งั้นต้องคอยอัปเดตให้ตรงกันเอง)
   */
  const shown =
    filter === "all" ? users : users.filter((u) => u.role === filter);

  /* ───────────── ระงับ / เปิดใช้งานบัญชี ─────────────
   * ทำงานเมื่อกดปุ่มในแถวของผู้ใช้ — รับผู้ใช้ทั้งคนในแถวนั้นเข้ามา
   */
  function toggleStatus(user: User) {
    // สลับสถานะ: ใช้งานอยู่ → ระงับ, ระงับอยู่ → ใช้งาน
    const next = user.status === "active" ? "suspended" : "active";

    // setUserStatus จะ throw ถ้าหาผู้ใช้ไม่เจอ หรือพยายามระงับ Admin
    // จึงครอบด้วย try/catch แล้วแสดงข้อความแทนที่หน้าเว็บจะพัง
    try {
      setUserStatus(user.id, next, adminId);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    }
  }

  /* ───────────── สร้างบัญชี Organizer / Vendor ─────────────
   * ทำงานเมื่อกดปุ่ม "สร้างบัญชี" หรือกด Enter ในฟอร์ม
   *
   * ต่างจากหน้า topup: createStaffAccount ไม่ throw แต่คืนผลลัพธ์
   *   { ok: true, user } หรือ { ok: false, reason }
   * เพราะอีเมลซ้ำหรือกรอกไม่ครบเป็นเรื่องปกติที่เกิดได้ ไม่ใช่บั๊ก
   * จึงใช้ if (!result.ok) แทน try/catch
   */
  function handleCreate() {
    const result = createStaffAccount({ role, name, email, password, adminId });

    // ไม่ผ่าน → แสดงเหตุผลจาก service (เช่น "อีเมลนี้มีผู้ใช้แล้ว") แล้วจบ
    // ช่องที่กรอกไว้ไม่ล้าง ผู้ใช้จะได้แก้แค่ช่องที่ผิด
    if (!result.ok) {
      setSuccess("");
      setFormError(result.reason);
      return;
    }

    // ถึงตรงนี้ TypeScript รู้แล้วว่า result เป็นแบบ ok: true (type narrowing)
    // จึงใช้ result.user ได้
    setFormError("");
    setSuccess(`สร้างบัญชี${ROLE_LABEL[role]} ${result.user.email} แล้ว`);

    // ล้างฟอร์ม พร้อมสร้างบัญชีถัดไป (role ไม่ล้าง เผื่อสร้างประเภทเดิมหลายบัญชี)
    setName("");
    setEmail("");
    setPassword("");
  }

  /* ───────────── ส่วนที่แสดงบนหน้าจอ (JSX) ───────────── */
  return (
    <div className="space-y-4">
      {/* ── การ์ดที่ 1: ฟอร์มสร้างบัญชี ── */}
      <Card>
        <CardTitle>สร้างบัญชีผู้จัดงาน / ร้านค้า</CardTitle>

        {/* <form> + e.preventDefault(): กด Enter เพื่อส่งได้ และไม่รีเฟรชหน้า
            grid sm:grid-cols-2: จอเล็กเรียงแถวเดียว จอใหญ่เป็น 2 คอลัมน์ */}
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          {/* dropdown เลือกประเภทบัญชี (select ที่ React ควบคุม)
              htmlFor="role" + id="role" ผูก label กับ select → คลิกข้อความแล้ว focus
              (ใน JSX ใช้ htmlFor เพราะ for เป็นคำสงวนของ JavaScript)
              e.target.value เป็น string เสมอ จึงใช้ as บอก TypeScript ว่าเป็น 1 ใน 2 ค่านี้
              ใช้ as ได้เพราะ <option> มีแค่ 2 ค่านี้จริง */}
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm text-slate-600">ประเภทบัญชี</label>
            <select
              id="role"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as "organizer" | "vendor")}
            >
              <option value="organizer">ผู้จัดงาน (Organizer)</option>
              <option value="vendor">ร้านค้า (Vendor)</option>
            </select>
          </div>

          {/* type="email" → มือถือเด้งแป้นที่มี @
              type="password" → ซ่อนตัวอักษรเป็นจุด
              การตรวจจริง (ชื่อว่าง อีเมลซ้ำ รหัสสั้น) อยู่ใน validateAccount ใน users.ts */}
          <Input label="ชื่อ" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="อีเมล" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="รหัสผ่าน" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {/* sm:col-span-2 → แถวนี้กว้างเต็ม 2 คอลัมน์ */}
          <div className="sm:col-span-2">
            {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
            {success && <p className="mb-2 text-sm text-green-700">{success}</p>}
            <Button type="submit">สร้างบัญชี</Button>
          </div>
        </form>
      </Card>

      {/* ── การ์ดที่ 2: ตารางผู้ใช้ ── */}
      <Card>
        {/* จำนวนคนนับจาก shown → เปลี่ยนตามปุ่มกรอง */}
        <CardTitle>ผู้ใช้ทั้งหมด ({shown.length} คน)</CardTitle>

        {/* ปุ่มกรองตาม Role — สร้างจาก FILTERS ด้วย .map
            ปุ่มที่เลือกอยู่เป็นสีน้ำเงิน (primary) ที่เหลือเป็นสีขาว (secondary) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "primary" : "secondary"}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        {/* overflow-x-auto → จอแคบ (มือถือ) ตารางเลื่อนซ้ายขวาได้ ไม่ล้นการ์ด */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ชื่อ</th>
                <th className="py-2 pr-4 font-medium">อีเมล</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                {/* คอลัมน์ปุ่ม ไม่มีหัวข้อ */}
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {/* 1 คน = 1 แถว ใช้ u.id เป็น key เพราะไม่ซ้ำแน่นอน */}
              {shown.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{ROLE_LABEL[u.role]}</td>
                  {/* มีเฉพาะ Customer — Role อื่นแสดง - */}
                  <td className="py-2 pr-4">{u.customerCode ?? "-"}</td>
                  <td className="py-2 pr-4">
                    {/* STATUS_TONE มาจาก components/ui → สีสถานะเหมือนกันทุกหน้า */}
                    <Badge tone={STATUS_TONE[u.status]}>
                      {u.status === "active" ? "ใช้งาน" : "ระงับ"}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    {/* ซ่อนปุ่มในแถว Admin (กันซ้อนกับ setUserStatus อีกชั้น)
                        onClick ต้องห่อด้วย () => … ถ้าเขียน onClick={toggleStatus(u)}
                        จะเรียกฟังก์ชันทันทีตอนวาดหน้า → ทุกคนถูกระงับหมด */}
                    {u.role !== "admin" && (
                      <Button
                        size="sm"
                        variant={u.status === "active" ? "danger" : "secondary"}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === "active" ? "ระงับ" : "เปิดใช้งาน"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* กรองแล้วไม่มีใครเลย → แสดงข้อความแทนตารางว่าง */}
        {shown.length === 0 && (
          <p className="py-6 text-center text-slate-500">ไม่มีผู้ใช้ใน Role นี้</p>
        )}
      </Card>
    </div>
  );
}
