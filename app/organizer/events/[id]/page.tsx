"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Card, CardTitle, Input, Modal } from "@/components/ui";
import { saveTicketType } from "@/lib/services/events";
import type { TicketType } from "@/lib/types";
import { useStore } from "@/lib/useStore";

function EventDetail() {
  // id มาจากชื่อโฟลเดอร์ [id] ใน URL เช่น /organizer/events/ev_reunion
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { user } = useAuth();

  const events = useStore("events");
  const ticketTypes = useStore("ticketTypes");

  // ต้องเป็นงานของผู้ล็อกอินเท่านั้น (กันพิมพ์ URL เข้ามาดูงานของคนอื่น)
  const event = events.find(
    (e) => e.id === eventId && e.organizerId === user?.id,
  );
  const types = ticketTypes.filter((t) => t.eventId === eventId);

  /* editing ตัวเดียวบอกได้ 3 อย่าง: null = ปิด · "new" = เพิ่มใหม่ · เป็นประเภทบัตร = แก้ตัวนั้น */
  const [editing, setEditing] = useState<TicketType | "new" | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quota, setQuota] = useState("");
  const [formError, setFormError] = useState("");

  function openCreate() {
    setEditing("new");
    setName("");
    setPrice("");
    setQuota("");
    setFormError("");
  }

  function openEdit(t: TicketType) {
    setEditing(t);
    setName(t.name);
    setPrice(String(t.price));
    setQuota(String(t.quota));
    setFormError("");
  }

  function handleSave() {
    if (editing === null) return;

    // แปลงข้อความเป็นตัวเลขตอนกดบันทึก
    // ต้องตรวจเองที่หน้านี้ เพราะ NaN < 0 เป็น false → service จะปล่อย NaN ผ่าน
    const priceNum = Number(price);
    const quotaNum = Number(quota);
    if (price.trim() === "" || !Number.isInteger(priceNum) || priceNum < 0) {
      setFormError("ราคาต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป");
      return;
    }
    if (!Number.isInteger(quotaNum) || quotaNum < 1) {
      setFormError("โควตาต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
      return;
    }

    try {
      if (editing === "new") {
        // id ว่าง = บัตรใหม่ · sold ส่ง 0 ไป (saveTicketType บังคับเป็น 0 อยู่แล้ว)
        saveTicketType({
          id: "",
          eventId,
          name,
          price: priceNum,
          quota: quotaNum,
          sold: 0,
        });
      } else {
        // แก้ของเดิม: ไม่ส่งค่า sold ใหม่ service ใช้ยอดจริงในระบบเสมอ
        saveTicketType({ ...editing, name, price: priceNum, quota: quotaNum });
      }
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    }
  }

  // ไม่พบงาน หรือไม่ใช่งานของคนนี้
  if (!event) {
    return (
      <Card>
        <p className="py-6 text-center text-slate-500">
          ไม่พบงานนี้ หรือคุณไม่มีสิทธิ์จัดการงานนี้
        </p>
        <div className="text-center">
          <Link href="/organizer/events" className="text-sm underline">
            กลับไปหน้ารายการ Event
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/organizer/events" className="text-sm text-slate-600 underline">
        ← กลับไปหน้ารายการ Event
      </Link>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <CardTitle>ประเภทบัตร · {event.title}</CardTitle>
          <Button size="sm" onClick={openCreate}>
            เพิ่มประเภทบัตร
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ชื่อ</th>
                <th className="py-2 pr-4 font-medium">ราคา</th>
                <th className="py-2 pr-4 font-medium">โควตา</th>
                <th className="py-2 pr-4 font-medium">ขายไปแล้ว</th>
                <th className="py-2 pr-4 font-medium">คงเหลือ</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{t.name}</td>
                  <td className="py-2 pr-4">{t.price} บาท</td>
                  <td className="py-2 pr-4">{t.quota}</td>
                  <td className="py-2 pr-4">{t.sold}</td>
                  <td className="py-2 pr-4">{t.quota - t.sold}</td>
                  <td className="py-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit(t)}
                    >
                      แก้ไข
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {types.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            ยังไม่มีประเภทบัตร กด "เพิ่มประเภทบัตร" เพื่อเริ่ม
          </p>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === "new"
            ? "เพิ่มประเภทบัตร"
            : editing
              ? `แก้ไข · ${editing.name}`
              : ""
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {editing && editing !== "new" && (
            <p className="text-sm text-slate-600">
              ขายไปแล้ว {editing.sold} ใบ · โควตาต้องไม่น้อยกว่านี้
            </p>
          )}
          <Input
            label="ชื่อประเภทบัตร"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="ราคา (บาท)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            label="โควตา (ใบ)"
            type="number"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
          />

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2">
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

// useParams ต้องครอบด้วย Suspense เพราะโปรเจกต์เปิด cacheComponents (กติกาข้อ 4 ของทีม)
export default function OrganizerEventsDetailPage() {
  return (
    <Suspense fallback={<p className="p-4 text-slate-500">กำลังโหลด...</p>}>
      <EventDetail />
    </Suspense>
  );
}