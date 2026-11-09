"use client";

import { useAuth } from "@/lib/auth";
import { Badge, Card, CardTitle } from "@/components/ui";
import type { EventStatus } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// ข้อความไทยของแต่ละสถานะ (ผู้ใช้ไม่ควรเห็นคำอังกฤษ draft / published / closed)
const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "ฉบับร่าง",
  published: "เปิดขาย",
  closed: "ปิดขาย",
};

export default function OrganizerEventsPage() {
  // ใครล็อกอินอยู่ (RoleGuard ให้เข้าหน้านี้ได้เฉพาะ Organizer จึงมี user เสมอ)
  const { user } = useAuth();
  const organizerId = user?.id ?? "";

  // useStore อัปเดตหน้าเองทุกครั้งที่ข้อมูลเปลี่ยน
  const events = useStore("events");
  const myEvents = events.filter((e) => e.organizerId === organizerId);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>จัดการ Event ({myEvents.length} งาน)</CardTitle>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">ชื่องาน</th>
                <th className="py-2 pr-4 font-medium">วันเวลา</th>
                <th className="py-2 pr-4 font-medium">สถานที่</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
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
    </div>
  );
}