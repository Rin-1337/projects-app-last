"use client";

import { useState } from "react";
import { useStore } from "@/lib/useStore";
import { Badge, Button, Card, CardTitle, Input } from "@/components/ui";
import type { Role } from "@/lib/types";
import { ACTION_LABEL, GROUPS, ROLE_LABEL, actionTone } from "./labels";

// ปุ่มกรองตาม role ของคนที่ทำ
const ROLES: { key: Role | "all"; label: string }[] = [
  { key: "all", label: "ทุกคน" },
  { key: "customer", label: "ลูกค้า" },
  { key: "vendor", label: "ร้านค้า" },
  { key: "organizer", label: "Organizer" },
  { key: "admin", label: "Admin" },
];

// ผู้รับผิดชอบ: นัฐวิ
// แสดงการกระทำของทุกคนทั้งเว็บ (ใคร ทำอะไร เมื่อไหร่) — ข้อมูลมาจาก logAction ใน lib/services
export default function AdminAuditLogsPage() {
  const logs = useStore("auditLogs");
  const users = useStore("users");
  const [group, setGroup] = useState("all");
  const [role, setRole] = useState<Role | "all">("all");
  const [search, setSearch] = useState("");

  // หาคนทำรายการจาก id (ไม่เจอ เช่น "system" → แสดง id ตรง ๆ)
  function userOf(id: string) {
    return users.find((u) => u.id === id);
  }

  const keyword = search.trim().toLowerCase();
  // กรองหมวด → กรอง role → กรองคำค้น (ชื่อ / อีเมล / รายละเอียด) → ใหม่สุดก่อน
  const shown = logs
    .filter((log) => group === "all" || log.action.startsWith(`${group}.`))
    .filter((log) => role === "all" || userOf(log.actorId)?.role === role)
    .filter((log) => {
      if (!keyword) return true;
      const user = userOf(log.actorId);
      const text = `${log.detail ?? ""} ${user?.name ?? log.actorId} ${user?.email ?? ""} ${ACTION_LABEL[log.action] ?? log.action}`;
      return text.toLowerCase().includes(keyword);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Card>
      <CardTitle>Audit Logs ({shown.length})</CardTitle>
      <p className="-mt-2 text-sm text-slate-500">ประวัติการใช้งานของทุกคนในระบบ ใครทำอะไร เมื่อไหร่ (แก้ไขหรือลบย้อนหลังไม่ได้)</p>

      {/* กรองตามหมวด */}
      <div className="mt-4 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <Button key={g.key} size="sm" variant={group === g.key ? "primary" : "secondary"} onClick={() => setGroup(g.key)}>
            {g.label}
          </Button>
        ))}
      </div>

      {/* กรองตาม role + ค้นหา */}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {ROLES.map((r) => (
          <Button key={r.key} size="sm" variant={role === r.key ? "primary" : "ghost"} onClick={() => setRole(r.key)}>
            {r.label}
          </Button>
        ))}
        <Input label="ค้นหา" placeholder="ชื่อ / อีเมล / รายละเอียด" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">ไม่มีรายการ</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">เวลา</th>
                <th className="py-2 pr-4 font-medium">ผู้ทำรายการ</th>
                <th className="py-2 pr-4 font-medium">การกระทำ</th>
                <th className="py-2 font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((log) => {
                const user = userOf(log.actorId);
                return (
                  <tr key={log.id} className="align-top">
                    <td className="whitespace-nowrap py-2 pr-4 text-slate-500">{new Date(log.createdAt).toLocaleString("th-TH")}</td>
                    <td className="py-2 pr-4">
                      <p className="font-medium text-slate-900">{user?.name ?? log.actorId}</p>
                      {user && <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]} · {user.email}</p>}
                    </td>
                    <td className="whitespace-nowrap py-2 pr-4">
                      {/* action ใหม่ที่ยังไม่มีในตาราง → แสดงชื่ออังกฤษไปก่อน */}
                      <Badge tone={actionTone(log.action)}>{ACTION_LABEL[log.action] ?? log.action}</Badge>
                    </td>
                    <td className="py-2 text-slate-700">{log.detail ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
