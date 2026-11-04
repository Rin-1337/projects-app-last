/**
 * ═══════════════════════════════════════════════════════════════════════
 * หน้า /admin/vendors — Admin จัดการร้านค้า
 * ผู้รับผิดชอบ: นัฐวิ (เซน)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * หน้านี้มี 3 ส่วน
 *   1. ฟอร์มสร้างร้าน    → createVendor()   ใน lib/services/vendors.ts
 *   2. ตารางร้านทั้งหมด + ปุ่มปิด/เปิดร้าน → updateVendor(..., { active })
 *   3. หน้าต่างแก้ราคา (Modal)            → updateVendor(..., { priceToken })
 *
 * กติกาจากบรีฟ: 1 ร้าน = 1 สินค้า 1 ราคา · Admin หาร้านเอง สร้างร้าน และตั้ง/แก้ราคา
 * ลำดับที่ Admin ทำ: สร้างบัญชี Vendor ที่ /admin/users ก่อน → มาสร้างร้านที่หน้านี้
 *
 * หน้านี้ไม่เขียน localStorage เอง ทุกอย่างผ่าน service
 *   - ตรวจข้อมูล (ชื่อว่าง ราคาผิด บัญชีมีร้านแล้ว) อยู่ใน service ที่เดียว
 *   - บันทึก Audit Log ให้อัตโนมัติ (vendor.create / vendor.update)
 * หน้าเว็บมีหน้าที่แค่ รับค่า → เรียก service → แสดงผล / แสดงข้อความ
 *
 * ถาม: ทำไมหน้านี้ไม่ต้อง setState หลังสร้างหรือแก้ร้าน ตารางก็เปลี่ยนเอง
 * ตอบ: service เขียนผ่าน updateStore → ส่งสัญญาณ → useStore("vendors") วาดหน้าใหม่ให้
 */

// ต้องมี "use client" เพราะใช้ useState, useStore และมีการกดปุ่ม (ทำงานในเบราว์เซอร์)
"use client";

import { useState } from "react";
import { Badge, Button, Card, CardTitle, Input, Modal } from "@/components/ui";
import { createVendor, updateVendor } from "@/lib/services/vendors";
// import type → ใช้แค่เป็นชนิดข้อมูล ไม่มีโค้ดจริงติดไปตอนรัน
import type { Vendor } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// ชั่วคราว: ใช้ Admin ทดลองไปก่อน (ส่งให้ service บันทึกใน Audit Log ว่าใครทำ)
// TODO: เปลี่ยนเป็น id ของคนที่ล็อกอินอยู่ เมื่อปอทำ useAuth() ใน lib/auth.tsx เสร็จ
const ADMIN_ID = "u_admin";

export default function AdminVendorsPage() {
  /* ───────────── ข้อมูลจาก localStorage ─────────────
   * useStore อ่านข้อมูลและอัปเดตเองทุกครั้งที่ข้อมูลเปลี่ยน
   *   vendors → แสดงในตาราง
   *   events  → ร้านเก็บแค่ eventId ต้องเอามาแปลงเป็นชื่องาน + ใช้ทำ dropdown Event
   *   users   → ใช้ทำ dropdown เลือกบัญชีร้านค้า
   */
  const vendors = useStore("vendors");
  const events = useStore("events");
  const users = useStore("users");

  /* ───────────── state ของตาราง ───────────── */
  // ข้อความแดงของตาราง เช่น ปิดร้านไม่สำเร็จ
  const [error, setError] = useState("");

  /* ───────────── state ของฟอร์มสร้างร้าน ─────────────
   * แต่ละช่องมี state ของตัวเอง (controlled input)
   * price เก็บเป็น string เพราะช่อง input คืนข้อความเสมอ
   *   ถ้าเก็บเป็น number พอลบจนว่างจะกลายเป็น 0 ขึ้นมาเอง
   *   จึงเก็บข้อความไว้ก่อน แล้วแปลงด้วย Number() ตอนกดสร้าง
   */
  const [userId, setUserId] = useState("");
  const [eventId, setEventId] = useState("");
  const [shopName, setShopName] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [boothNo, setBoothNo] = useState("");
  // ข้อความแดง / เขียวของฟอร์ม — แยกจาก error ของตาราง จะได้แสดงคนละที่
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  /* ───────────── state ของหน้าต่างแก้ราคา ─────────────
   * editing ตัวเดียวบอกได้ 2 อย่าง
   *   null      → หน้าต่างปิด
   *   เป็นร้าน  → หน้าต่างเปิด และกำลังแก้ร้านนี้
   * ไม่แยกเป็น open + vendor สองตัว เพราะอาจเกิดสถานะแปลก เช่น เปิดอยู่แต่ไม่มีร้าน
   */
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [editError, setEditError] = useState("");

  /* ───────────── บัญชี Vendor ที่ยังว่าง (ใช้ใน dropdown) ─────────────
   * ต้องผ่าน 3 เงื่อนไข: เป็น Vendor · ไม่ถูกระงับ · ยังไม่มีร้าน
   * !vendors.some(...) = ไม่มีร้านไหนเลยที่เป็นของบัญชีนี้
   *
   * ถาม: createVendor ก็ตรวจ "บัญชีนี้มีร้านแล้ว" อยู่แล้ว ทำไมกรองซ้ำตรงนี้
   * ตอบ: คนละหน้าที่ — หน้าเว็บกรองให้ใช้ง่าย ไม่ให้เลือกผิดตั้งแต่แรก
   *      service คือด่านจริง เผื่อมีที่อื่นเรียก createVendor โดยไม่กรอง
   * คำนวณใหม่ทุกครั้งที่หน้าวาด → สร้างร้านแล้วบัญชีนั้นหายจาก dropdown เอง
   * ไม่เก็บเป็น state เพราะคำนวณจาก users + vendors ได้อยู่แล้ว
   */
  const freeVendorUsers = users.filter(
    (u) =>
      u.role === "vendor" &&
      u.status === "active" &&
      !vendors.some((v) => v.userId === u.id),
  );

  /* ───────────── แปลง eventId เป็นชื่องาน ─────────────
   * find(...)  หางานที่ id ตรงกัน ไม่เจอได้ undefined
   * ?.title    เจอ → เอาชื่อ / ไม่เจอ → หยุด ไม่ error
   * ?? "-"     ได้ undefined → แสดง "-" (เช่น Event ถูกลบไปแล้ว หน้าเว็บไม่พัง)
   */
  function eventTitle(id: string) {
    return events.find((e) => e.id === id)?.title ?? "-";
  }

  /* ───────────── ปิด / เปิดร้าน ─────────────
   * !vendor.active กลับค่า true ↔ false → ปุ่มเดียวสลับได้ทั้งสองทาง
   * ส่งไปแค่ { active } ช่องเดียว ช่องอื่นคงเดิม (updateVendor รับ Partial)
   * updateVendor throw ถ้าหาร้านไม่เจอ → ครอบ try/catch ให้ขึ้นข้อความแทนหน้าพัง
   *
   * ถาม: ทำไมไม่มีปุ่มลบร้าน
   * ตอบ: ร้านมีประวัติขายและถอนเงินผูกอยู่ ลบแล้วรายงานเคลียร์เงินของเตยจะหาร้านไม่เจอ
   *      ปิดไว้ข้อมูลยังอยู่ครบ และเปิดกลับได้
   */
  function toggleActive(vendor: Vendor) {
    try {
      updateVendor(vendor.id, { active: !vendor.active }, ADMIN_ID);
      setError("");
    } catch (err) {
      // err อาจเป็นอะไรก็ได้ ต้องเช็กว่าเป็น Error จริงก่อนใช้ .message
      setError(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    }
  }

  /* ───────────── สร้างร้าน ─────────────
   * createVendor ไม่ throw แต่คืน { ok: true, vendor } | { ok: false, reason }
   * เพราะเลือกบัญชีผิด / ลืมกรอก / ราคาผิด เป็นเรื่องปกติของฟอร์ม ไม่ใช่บั๊ก
   * → ใช้ if (!result.ok) แทน try/catch (ท่าเดียวกับหน้า users)
   *
   * Number(price): "10" → 10, "" → 0, "abc" → NaN
   * ค่าที่ผิด (0, NaN, 12.5) ส่งไปได้เลย checkShopFields ใน service จะตอบเหตุผลกลับมา
   */
  function handleCreate() {
    const result = createVendor({
      userId,
      eventId,
      shopName,
      productName,
      priceToken: Number(price),
      boothNo,
      adminId: ADMIN_ID,
    });

    // ไม่ผ่าน → แสดงเหตุผลจาก service แล้วจบ (ไม่ล้างช่อง ผู้ใช้จะได้แก้แค่ช่องที่ผิด)
    if (!result.ok) {
      setSuccess("");
      setFormError(result.reason);
      return;
    }

    // ถึงตรงนี้ TypeScript รู้แล้วว่าเป็นแบบ ok: true จึงใช้ result.vendor ได้
    setFormError("");
    setSuccess(`สร้างร้าน ${result.vendor.shopName} แล้ว`);

    // ล้างฟอร์ม — แต่ไม่ล้าง eventId เพราะ Admin มักสร้างหลายร้านในงานเดียวกัน
    setUserId("");
    setShopName("");
    setProductName("");
    setPrice("");
    setBoothNo("");
  }

  /* ───────────── เปิดหน้าต่างแก้ราคา ─────────────
   * 1. จำว่ากำลังแก้ร้านไหน (หน้าต่างเปิดเพราะ editing ไม่เป็น null)
   * 2. ใส่ราคาเดิมไว้ในช่อง — String() เพราะ state ของช่องเป็นข้อความ
   * 3. ล้าง error ที่ค้างจากการแก้ครั้งก่อน
   */
  function openEdit(vendor: Vendor) {
    setEditing(vendor);
    setNewPrice(String(vendor.priceToken));
    setEditError("");
  }

  /* ───────────── บันทึกราคาใหม่ ─────────────
   * if (!editing) return → editing อาจเป็น null ต้องเช็กก่อนถึงใช้ editing.id ได้
   * ส่งแค่ { priceToken } ช่องอื่นคงเดิม ราคาผิด → updateVendor throw ข้อความจาก checkShopFields
   *   (ฟอร์มสร้างร้านกับหน้าต่างแก้ราคาจึงใช้กติกาเดียวกัน)
   * setEditing(null) อยู่หลัง updateVendor ใน try
   *   → สำเร็จเท่านั้นถึงปิดหน้าต่าง / error จะกระโดดไป catch หน้าต่างยังเปิดให้แก้
   *
   * ถาม: แก้ราคาแล้ว การขายที่ผ่านไปแล้วเปลี่ยนตามไหม
   * ตอบ: ไม่ เพราะธุรกรรมเก็บจำนวน Token ที่หักจริง (amount) ไว้ตอนขาย ไม่ได้อ้างราคาร้าน
   *      และ Audit Log บันทึกไว้ว่า "ราคา 10 → 12 Token" เมื่อไหร่
   */
  function handleSavePrice() {
    if (!editing) return;
    try {
      updateVendor(editing.id, { priceToken: Number(newPrice) }, ADMIN_ID);
      setEditing(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "แก้ราคาไม่สำเร็จ");
    }
  }

  /* ───────────── ส่วนที่แสดงบนหน้าจอ (JSX) ───────────── */
  return (
    <div className="space-y-4">
      {/* ── การ์ดที่ 1: ฟอร์มสร้างร้าน ──
          <form> + e.preventDefault(): กด Enter ส่งได้ และไม่รีเฟรชหน้า
          grid sm:grid-cols-2: จอเล็กเรียงแถวเดียว จอใหญ่ 2 คอลัมน์ */}
      <Card>
        <CardTitle>สร้างร้านค้า</CardTitle>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          {/* dropdown บัญชีร้านค้า — แสดงเฉพาะ freeVendorUsers
              ค่าเริ่มต้น "" = ยังไม่เลือก → service ตอบ "กรุณาเลือกบัญชีร้านค้า (Vendor)"
              value ของ option คือ u.id (ส่งให้ service) ส่วนข้อความคือชื่อ + อีเมล (ให้คนอ่าน) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="vendorUser" className="text-sm text-slate-600">
              บัญชีร้านค้า
            </label>
            <select
              id="vendorUser"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">— เลือกบัญชี —</option>
              {freeVendorUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* dropdown Event — ท่าเดียวกัน value คือ id ข้อความคือชื่องาน */}
          <div className="flex flex-col gap-1">
            <label htmlFor="event" className="text-sm text-slate-600">
              Event
            </label>
            <select
              id="event"
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">— เลือก Event —</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="ชื่อร้าน"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <Input
            label="สินค้า"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          {/* type="number" → มือถือเด้งแป้นตัวเลข
              ไม่ใส่ min={1} เพราะเบราว์เซอร์จะขึ้นเตือนภาษาอังกฤษเองและไม่เรียก handleCreate
              ให้ service ตรวจที่เดียว ข้อความเป็นภาษาไทยรูปแบบเดียวกันทั้งระบบ */}
          <Input
            label="ราคาต่อชิ้น (Token)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="บูธ (ไม่บังคับ)"
            value={boothNo}
            onChange={(e) => setBoothNo(e.target.value)}
          />

          {/* sm:col-span-2 → แถวนี้กว้างเต็ม 2 คอลัมน์ */}
          <div className="sm:col-span-2">
            {formError && (
              <p className="mb-2 text-sm text-red-600">{formError}</p>
            )}
            {success && (
              <p className="mb-2 text-sm text-green-700">{success}</p>
            )}
            <Button type="submit">สร้างร้าน</Button>
          </div>
        </form>
      </Card>

      {/* ── การ์ดที่ 2: ตารางร้านค้า ── */}
      <Card>
        <CardTitle>ร้านค้าทั้งหมด ({vendors.length} ร้าน)</CardTitle>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        {/* overflow-x-auto → จอแคบ ตารางเลื่อนซ้ายขวาได้ ไม่ล้นการ์ด */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ร้าน</th>
                <th className="py-2 pr-4 font-medium">สินค้า</th>
                <th className="py-2 pr-4 font-medium">ราคา</th>
                <th className="py-2 pr-4 font-medium">Event</th>
                <th className="py-2 pr-4 font-medium">บูธ</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                {/* คอลัมน์ปุ่ม ไม่มีหัวข้อ */}
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {/* 1 ร้าน = 1 แถว ใช้ v.id เป็น key เพราะไม่ซ้ำแน่นอน */}
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{v.shopName}</td>
                  <td className="py-2 pr-4">{v.productName}</td>
                  <td className="py-2 pr-4">{v.priceToken} Token</td>
                  <td className="py-2 pr-4">{eventTitle(v.eventId)}</td>
                  {/* boothNo ไม่บังคับ ไม่มีแสดง "-" */}
                  <td className="py-2 pr-4">{v.boothNo ?? "-"}</td>
                  <td className="py-2 pr-4">
                    {/* ไม่ใช้ STATUS_TONE แบบหน้า users เพราะ active เป็น true/false ไม่ใช่ข้อความ */}
                    <Badge tone={v.active ? "green" : "gray"}>
                      {v.active ? "เปิดขาย" : "ปิดชั่วคราว"}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    {/* onClick ต้องห่อด้วย () => …
                        ถ้าเขียน onClick={toggleActive(v)} จะทำงานทันทีตอนวาดหน้า ทุกร้านถูกสลับเอง */}
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEdit(v)}
                      >
                        แก้ราคา
                      </Button>
                      {/* ร้านเปิดอยู่ → ปุ่ม "ปิดร้าน" สีแดง (เตือนว่ามีผล) */}
                      <Button
                        size="sm"
                        variant={v.active ? "danger" : "secondary"}
                        onClick={() => toggleActive(v)}
                      >
                        {v.active ? "ปิดร้าน" : "เปิดร้าน"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {vendors.length === 0 && (
          <p className="py-6 text-center text-slate-500">ยังไม่มีร้านค้า</p>
        )}
      </Card>

      {/* ── หน้าต่างแก้ราคา (Modal) ──
          เปิดเมื่อ editing ไม่เป็น null · กด Esc / คลิกพื้นหลัง / ยกเลิก → setEditing(null)
          (Esc กับคลิกพื้นหลังเขียนไว้แล้วใน components/ui/Modal.tsx)
          editing?.… → ตอนหน้าต่างปิด editing เป็น null ใช้ ?. กันไม่ให้ error

          ถาม: ทำไมใช้หน้าต่างแยก ไม่แก้ตรงในตาราง
          ตอบ: ราคามีผลกับเงินลูกค้าทุกคน ให้เห็นราคาเดิมและต้องกดบันทึกอีกครั้ง กันกดพลาด */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`แก้ราคา · ${editing?.shopName ?? ""}`}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSavePrice();
          }}
        >
          <p className="text-sm text-slate-600">
            ราคาปัจจุบัน {editing?.priceToken} Token ต่อ {editing?.productName}
            {" · "}การขายที่ผ่านไปแล้วไม่เปลี่ยน
          </p>
          <Input
            label="ราคาใหม่ (Token)"
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          {/* มีข้อความ error เมื่อไหร่ค่อยแสดง */}
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex justify-end gap-2">
            {/* Button ตั้ง type="button" เป็นค่าเริ่มต้น → กดยกเลิกไม่ส่งฟอร์ม */}
            <Button variant="secondary" onClick={() => setEditing(null)}>
              ยกเลิก
            </Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
