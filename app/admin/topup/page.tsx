/**
 * หน้า /admin/topup — Admin เติม Token ให้ลูกค้าหน้างาน
 * ผู้รับผิดชอบ: นัฐวิ
 *
 * ขั้นตอนการใช้งาน
 *   1. Admin พิมพ์ Customer ID ที่ลูกค้าแจ้ง แล้วกดค้นหา
 *   2. ระบบแสดงข้อมูลลูกค้า (ชื่อ อีเมล เบอร์ ยอดคงเหลือ) ให้ Admin ยืนยันตัวตน
 *   3. Admin กรอกจำนวน เลือกช่องทาง (เงินสด / QR) แล้วกดยืนยันรับเงิน
 *   4. ระบบเพิ่ม Token เข้ากระเป๋าลูกค้า บันทึกธุรกรรม และบันทึก Audit Log
 *
 * หน้านี้ไม่ได้เขียน localStorage เอง ทุกอย่างผ่าน service:
 *   - ค้นหาลูกค้า → findCustomerByCode() ใน lib/services/users.ts
 *   - เติม Token  → topupOnsite()        ใน lib/services/wallet.ts
 */

// ต้องมี "use client" เพราะหน้านี้ใช้ useState, useStore และมีการกดปุ่ม
// ซึ่งทำงานได้เฉพาะในเบราว์เซอร์ (ฝั่ง client) ไม่ใช่ฝั่ง server
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Card, CardTitle, Input } from "@/components/ui";
import { findCustomerByCode } from "@/lib/services/users";
import type { User } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { topupOnsite } from "@/lib/services/wallet";

export default function AdminTopupPage() {
  /* ───────────── state: ค่าที่หน้าเว็บต้องจำ ─────────────
   * useState คืนค่าเป็นคู่ [ค่าปัจจุบัน, ฟังก์ชันเปลี่ยนค่า]
   * ทุกครั้งที่เรียกฟังก์ชันเปลี่ยนค่า React จะวาดหน้าใหม่ให้ตรงกับค่าล่าสุด
   * (ถ้าใช้ตัวแปรธรรมดา เช่น let code = "" หน้าจอจะไม่อัปเดตตอนค่าเปลี่ยน)
   */

  // Customer ID ที่ Admin พิมพ์ในช่องค้นหา
  const [code, setCode] = useState("");

  // ลูกค้าที่ค้นหาเจอ — ตอนแรกยังไม่มีจึงเป็น null
  // ใส่ <User | null> บอก TypeScript ว่าค่านี้เป็น User หรือ null ก็ได้
  const [customer, setCustomer] = useState<User | null>(null);

  // ข้อความแดงของการค้นหา เช่น "ไม่พบลูกค้ารหัส C9999" ("" = ไม่มี error)
  const [error, setError] = useState("");

  // จำนวนที่จะเติม — เก็บเป็นข้อความ เพราะช่องกรอกส่งค่าออกมาเป็นข้อความเสมอ
  // ค่อยแปลงเป็นตัวเลขด้วย Number() ตอนกดเติม
  const [amount, setAmount] = useState("");

  // ช่องทางรับเงิน — กำหนด type ให้เลือกได้แค่ 2 ค่านี้ พิมพ์ผิดจะขีดแดงทันที
  const [channel, setChannel] = useState<"onsite_cash" | "onsite_qr">(
    "onsite_cash",
  );

  // ข้อความเขียวหลังเติมสำเร็จ
  const [success, setSuccess] = useState("");

  // ข้อความแดงของการเติม — แยกจาก error ของการค้นหา
  // จะได้แสดงใต้ฟอร์มที่เกี่ยวข้อง ไม่ปนกัน
  const [topupError, setTopupError] = useState("");

  // id ของ Admin ที่ล็อกอินอยู่ — ส่งให้ service บันทึกใน Audit Log ว่าใครทำ
  // RoleGuard ใน app/admin/layout.tsx ให้เข้าหน้านี้ได้เฉพาะ Admin จึงมี user เสมอ
  const { user } = useAuth();
  const adminId = user?.id ?? "";

  /* ───────────── ยอดคงเหลือของลูกค้า ─────────────
   * ใช้ useStore("wallets") แทน getBalance() เพราะ useStore อัปเดตเอง
   * ทุกครั้งที่ข้อมูลกระเป๋าเปลี่ยน → พอกดเติมแล้ว ยอดในการ์ดเพิ่มทันที
   * ไม่ต้องกดค้นหาใหม่ ส่วน getBalance() อ่านแค่ครั้งเดียวตอนเรียก
   *
   * อ่านแบบภาษาคน: ถ้ามีลูกค้า → หากระเป๋าของลูกค้าคนนั้น เอายอด (ไม่มีกระเป๋า = 0)
   *                ถ้ายังไม่มีลูกค้า → 0
   */
  const wallets = useStore("wallets");
  const balance = customer
    ? (wallets.find((w) => w.userId === customer.id)?.balance ?? 0)
    : 0;

  /* ───────────── ค้นหาลูกค้าจาก Customer ID ─────────────
   * ทำงานเมื่อกดปุ่ม "ค้นหา" หรือกด Enter ในช่องค้นหา
   */
  function handleSearch() {
    // ล้างข้อความของลูกค้าคนก่อน กันไม่ให้ Admin เข้าใจผิดว่าเติมให้คนใหม่แล้ว
    setSuccess("");
    setTopupError("");

    // findCustomerByCode จัดการตัวพิมพ์เล็ก-ใหญ่และช่องว่างให้แล้ว (c0001 ก็เจอ)
    const found = findCustomerByCode(code);

    // ไม่เจอ → ซ่อนการ์ดลูกค้า แสดงข้อความแดง แล้วจบฟังก์ชันทันที (return)
    if (!found) {
      setCustomer(null);
      setError(`ไม่พบลูกค้ารหัส ${code}`);
      return;
    }

    // เจอ → เก็บลูกค้าไว้ (การ์ดข้อมูลกับฟอร์มเติมจะโผล่ขึ้นมาเอง) และล้าง error
    setCustomer(found);
    setError("");
  }

  /* ───────────── เติม Token ─────────────
   * ทำงานเมื่อกดปุ่ม "ยืนยันรับเงินและเติม Token"
   */
  function handleTopup() {
    // กันไว้ก่อน: ถ้ายังไม่ได้เลือกลูกค้า ไม่ต้องทำอะไร
    // (ปกติจะไม่เกิด เพราะฟอร์มแสดงเฉพาะตอนมีลูกค้า แต่ช่วยให้ TypeScript
    //  รู้ว่าหลังบรรทัดนี้ customer ไม่ใช่ null แล้ว)
    if (!customer) return;

    const value = Number(amount);

    // topupOnsite จะ throw error ถ้ายอดไม่ถูกต้อง (เช่น 0, ติดลบ, ทศนิยม)
    // จึงครอบด้วย try/catch — ถ้า error เกิดใน try โค้ดจะกระโดดไป catch ทันที
    // หน้าเว็บจะแสดงข้อความแดงแทนที่จะพัง
    try {
      topupOnsite({
        customerId: customer.id,
        amount: value,
        channel,
        adminId,
      });

      // ถึงบรรทัดนี้ได้แปลว่าเติมสำเร็จ
      setSuccess(
        `เติม ${value.toLocaleString()} Token ให้ ${customer.name} แล้ว`,
      );
      setTopupError("");
      setAmount(""); // ล้างช่องจำนวน กันกดยืนยันซ้ำโดยไม่ตั้งใจ
    } catch (err) {
      setSuccess("");
      // สิ่งที่ถูก throw อาจไม่ใช่ Error เสมอไป จึงเช็กก่อนใช้ .message
      setTopupError(
        err instanceof Error ? err.message : "เติม Token ไม่สำเร็จ",
      );
    }
  }

  /* ───────────── ส่วนที่แสดงบนหน้าจอ (JSX) ───────────── */
  return (
    <div className="space-y-4">
      {/* ── การ์ดที่ 1: ช่องค้นหา Customer ID ── */}
      <Card>
        <CardTitle>เติม Token หน้างาน</CardTitle>

        {/* ใช้ <form> ครอบ → กด Enter ในช่องค้นหาได้ ไม่ต้องคลิกปุ่ม
            e.preventDefault() กันไม่ให้เบราว์เซอร์รีเฟรชหน้าตอนส่งฟอร์ม
            (พฤติกรรมเดิมของ HTML ซึ่งจะทำให้ state หายหมด) */}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <div className="flex-1">
            {/* ช่องกรอกที่ React ควบคุม (controlled input):
                value={code}  → ช่องแสดงค่าจาก state เสมอ
                onChange      → พิมพ์แล้วเอาค่าใหม่ไปใส่ state */}
            <Input
              label="Customer ID"
              placeholder="เช่น C0001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <Button type="submit">ค้นหา</Button>
        </form>

        {/* แสดงเฉพาะตอนมี error — ถ้า error เป็น "" จะไม่แสดงอะไร */}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      {/* การ์ดที่ 2 และ 3 แสดงเฉพาะตอนค้นหาเจอลูกค้าแล้ว (conditional rendering)
          ครอบด้วย <>…</> (Fragment) เพราะต้องคืนก้อนเดียว แต่ไม่อยากเพิ่ม div */}
      {customer && (
        <>
          {/* ── การ์ดที่ 2: ข้อมูลลูกค้า ให้ Admin ยืนยันตัวตนก่อนรับเงิน ── */}
          <Card>
            <CardTitle>ข้อมูลลูกค้า</CardTitle>
            {/* <dl>/<dt>/<dd> คือแท็กสำหรับรายการ "หัวข้อ – ค่า"
                grid grid-cols-2 จัดเป็น 2 คอลัมน์: ซ้ายหัวข้อ ขวาค่า */}
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">ชื่อ</dt>
              <dd>{customer.name}</dd>
              <dt className="text-slate-500">Customer ID</dt>
              <dd>{customer.customerCode}</dd>
              <dt className="text-slate-500">อีเมล</dt>
              <dd>{customer.email}</dd>
              <dt className="text-slate-500">เบอร์โทร</dt>
              {/* ?? "-" → ไม่มีเบอร์ให้แสดง - แทน */}
              <dd>{customer.phone ?? "-"}</dd>
              <dt className="text-slate-500">ยอดคงเหลือ</dt>
              {/* toLocaleString() ใส่ลูกน้ำคั่นหลักพัน เช่น 1500 → 1,500 */}
              <dd className="text-lg font-bold">
                {balance.toLocaleString()} Token
              </dd>
            </dl>
          </Card>

          {/* ── การ์ดที่ 3: ฟอร์มเติม Token ── */}
          <Card>
            <CardTitle>เติม Token</CardTitle>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleTopup();
              }}
            >
              {/* type="number" → มือถือเด้งแป้นตัวเลข
                  min/step → เบราว์เซอร์ไม่ยอมส่งฟอร์มถ้าเป็น 0 หรือทศนิยม
                  (เป็นด่านแรก ด่านจริงคือ assertValidAmount ใน wallet.ts) */}
              <Input
                label="จำนวนเงิน (บาท) = จำนวน Token"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* ปุ่มลัดจำนวนที่ใช้บ่อย — สร้างจาก array ด้วย .map ไม่ต้องเขียนซ้ำ 4 ปุ่ม
                  key={v}       → React ต้องมี key ทุกครั้งที่สร้างจาก .map
                  type="button" → สำคัญมาก! ปุ่มใน <form> เป็นปุ่มส่งฟอร์มโดยอัตโนมัติ
                                  ถ้าไม่ใส่ กดปุ่ม 500 แล้วจะเติมเงินทันทีโดยไม่ทันเช็ก */}
              <div className="flex flex-wrap gap-2">
                {[100, 200, 500, 1000].map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAmount(String(v))}
                  >
                    {v.toLocaleString()}
                  </Button>
                ))}
              </div>

              {/* เลือกช่องทางรับเงิน (radio ที่ React ควบคุม)
                  checked={…} → ติ๊กอันที่ตรงกับ state
                  name เหมือนกันทั้ง 2 อัน → เลือกได้ทีละอัน
                  ช่องทางนี้จะถูกบันทึกในธุรกรรมและ Audit Log */}
              <fieldset>
                <legend className="mb-1 text-sm text-slate-600">ช่องทางรับเงิน</legend>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="channel"
                      checked={channel === "onsite_cash"}
                      onChange={() => setChannel("onsite_cash")}
                    />
                    เงินสด
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="channel"
                      checked={channel === "onsite_qr"}
                      onChange={() => setChannel("onsite_qr")}
                    />
                    QR Code
                  </label>
                </div>
              </fieldset>

              {/* ผลลัพธ์ของการเติม: แดง = ไม่สำเร็จ, เขียว = สำเร็จ */}
              {topupError && <p className="text-sm text-red-600">{topupError}</p>}
              {success && <p className="text-sm text-green-700">{success}</p>}

              {/* disabled={!amount} → ยังไม่กรอกจำนวน กดปุ่มไม่ได้
                  ข้อความบนปุ่มย้ำว่า Admin ต้องรับเงินจากลูกค้าก่อนกด */}
              <Button type="submit" disabled={!amount}>
                ยืนยันรับเงินและเติม Token
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
