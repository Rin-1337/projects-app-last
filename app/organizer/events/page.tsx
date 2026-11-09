"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Card, CardTitle, Input, Modal } from "@/components/ui";
import { saveEvent } from "@/lib/services/events";
import type { EventItem, EventStatus } from "@/lib/types";
import { useStore } from "@/lib/useStore";

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "ฉบับร่าง",
  published: "เปิดขาย",
  closed: "ปิดขาย",
};

// แปลง ISO เป็นรูปแบบที่ช่อง datetime-local ต้องการ: "2026-12-12T17:00" (เวลาของเครื่อง)
function toInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OrganizerEventsPage() {
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  const events = useStore("events");
  const myEvents = events.filter((e) => e.organizerId === organizerId);

  /* editing ตัวเดียวบอกได้ 3 อย่าง
   *   null      → หน้าต่างปิด
   *   "new"     → เปิดเพื่อสร้าง Event ใหม่
   *   เป็น Event → เปิดเพื่อแก้ Event นั้น */
  const [editing, setEditing] = useState<EventItem | "new" | null>(null);

  // ทุกช่องเก็บเป็นข้อความ (controlled input)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState("");

  function openCreate() {
    setEditing("new");
    setTitle("");
    setDescription("");
    setStartAt("");
    setLocation("");
    setFormError("");
  }

  function openEdit(ev: EventItem) {
    setEditing(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setStartAt(toInputValue(ev.startAt));
    setLocation(ev.location);
    setFormError("");
  }

  function handleSave() {
    if (editing === null || organizerId === "") return;

    // saveEvent ตรวจแค่ชื่อว่าง ส่วนวันเวลากับสถานที่ตรวจที่หน้านี้
    const start = new Date(startAt);
    if (startAt === "" || Number.isNaN(start.getTime())) {
      setFormError("กรุณาเลือกวันเวลาเริ่มงาน");
      return;
    }
    if (location.trim() === "") {
      setFormError("กรุณากรอกสถานที่จัดงาน");
      return;
    }

    try {
      if (editing === "new") {
        // id กับ createdAt ปล่อยว่าง ให้ saveEvent สร้างให้เอง
        saveEvent({
          id: "",
          title,
          description,
          startAt: start.toISOString(),
          location,
          organizerId,
          status: "draft",
          createdAt: "",
        });
      } else {
        // แก้ของเดิม: เอาทั้งก้อนเดิมมา แล้วทับเฉพาะช่องที่ฟอร์มแก้ได้
        saveEvent({
          ...editing,
          title,
          description,
          startAt: start.toISOString(),
          location,
        });
      }
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    }
  }

  const modalTitle =
    editing === "new"
      ? "สร้าง Event ใหม่"
      : editing
        ? `แก้ไข · ${editing.title}`
        : "";

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <CardTitle>จัดการ Event ({myEvents.length} งาน)</CardTitle>
          <Button size="sm" onClick={openCreate}>
            สร้าง Event
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ชื่องาน</th>
                <th className="py-2 pr-4 font-medium">วันเวลา</th>
                <th className="py-2 pr-4 font-medium">สถานที่</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {myEvents.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{ev.title}</td>
                  <td className="py-2 pr-4">
                    {new Date(ev.startAt).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-2 pr-4">{ev.location}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={ev.status === "published" ? "green" : "gray"}>
                      {STATUS_LABEL[ev.status]}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit(ev)}
                    >
                      แก้ไข
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {myEvents.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            ยังไม่มี Event ที่คุณรับผิดชอบ
          </p>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={modalTitle}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Input
            label="ชื่องาน"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm text-slate-600">
              รายละเอียด
            </label>
            <textarea
              id="description"
              rows={3}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Input
            label="วันเวลาเริ่มงาน"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          <Input
            label="สถานที่"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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