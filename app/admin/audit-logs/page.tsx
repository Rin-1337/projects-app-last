"use client";

import { useState } from "react";
import { useStore } from "@/lib/useStore";
import { Badge, Button, Card, CardTitle, Input } from "@/components/ui";

// แปลงชื่อ action ในระบบ → ภาษาไทย (ครบทุกตัวที่ logAction ใช้อยู่)
const ACTION_LABEL: Record<string, string> = {
  "user.create": "สร้างบัญชี",
  "user.suspend": "ระงับบัญชี",
  "user.activate": "เปิดใช้บัญชี",
  "vendor.create": "สร้างร้าน",
  "vendor.update": "แก้ไขร้าน",
  "wallet.topup": "เติม Token หน้างาน",
  "withdrawal.approve": "อนุมัติถอนเงิน",
  "withdrawal.reject": "ไม่อนุมัติถอนเงิน",
  "withdrawal.transfer": "บันทึกการโอน",
  "event.assign": "กำหนด Organizer",
};
// ปุ่มกรองหมวด (key = คำหน้าจุดของ action เช่น "vendor.update" → "vendor")
const GROUPS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "user", label: "บัญชี" },
  { key: "vendor", label: "ร้านค้า" },
  { key: "wallet", label: "เติม Token" },
  { key: "withdrawal", label: "ถอนเงิน" },
  { key: "event", label: "Event" },
];

export default function AdminAuditLogsPage() {
  const logs = useStore("auditLogs");
  const users = useStore("users");
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");

  // หาชื่อคนทำรายการ (ไม่เจอ → โชว์ id)
  function nameOf(id: string) {
    return users.find((u) => u.id === id)?.name ?? id;
  }

  const keyword = search.trim().toLowerCase();
  // กรองหมวด → กรองคำค้น (ค้นทั้งรายละเอียดและชื่อคนทำ) → ใหม่สุดก่อน
  const shown = logs
    .filter((log) => group === "all" || log.action.startsWith(`${group}.`))
    .filter(
      (log) =>
        !keyword ||
        `${log.detail ?? ""} ${nameOf(log.actorId)}`
          .toLowerCase()
          .includes(keyword),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Card>
      <CardTitle>Audit Logs ({shown.length})</CardTitle>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {GROUPS.map((g) => (
          <Button
            key={g.key}
            size="sm"
            variant={group === g.key ? "primary" : "secondary"}
            onClick={() => setGroup(g.key)}
          >
            {g.label}
          </Button>
        ))}
        <Input
          label="ค้นหา"
          placeholder="ชื่อร้าน / ชื่อคน / รายละเอียด"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">ไม่มีรายการ</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {shown.map((log) => (
            <li key={log.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* ถ้าเจอ action ใหม่ที่ยังไม่มีในตาราง → โชว์ชื่ออังกฤษไปก่อน */}
                <Badge tone="blue">
                  {ACTION_LABEL[log.action] ?? log.action}
                </Badge>
                <p className="text-sm text-slate-600">
                  {new Date(log.createdAt).toLocaleString("th-TH")} · โดย{" "}
                  {nameOf(log.actorId)}
                </p>
              </div>
              {log.detail && (
                <p className="mt-1 text-slate-900">{log.detail}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
