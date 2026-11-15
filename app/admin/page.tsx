"use client";

import Link from "next/link";
import { useStore } from "@/lib/useStore";
import { Card, CardTitle } from "@/components/ui";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", organizer: "Organizer", vendor: "ร้านค้า", customer: "ลูกค้า" };

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminPage() {
  // อ่านทุก store ที่ต้องใช้ (อัปเดตทันทีเมื่อข้อมูลเปลี่ยน)
  const users = useStore("users");
  const wallets = useStore("wallets");
  const transactions = useStore("tokenTransactions");
  const withdrawals = useStore("withdrawals");
  const events = useStore("events");
  const vendors = useStore("vendors");

  // Token ในระบบ = ยอด wallet ทุกคนรวมกัน
  const inSystem = wallets.reduce((sum, w) => sum + w.balance, 0);
  // รวมยอดธุรกรรมตามประเภท
  const sumOf = (type: string) => transactions.filter((tx) => tx.type === type).reduce((sum, tx) => sum + tx.amount, 0);
  // ตัวเลขงานค้าง
  const pending = withdrawals.filter((w) => w.status === "pending").length;
  const toTransfer = withdrawals.filter((w) => w.status === "approved").length;
  const noOrganizer = events.filter((e) => !e.organizerId).length;
  const role: Role[] = ["customer", "vendor", "organizer", "admin"];

  // การ์ดยอด 4 ใบ
  const stats = [
    { label: "Token ในระบบตอนนี้", value: inSystem, color: "text-blue-700" },
    { label: "ยอดเติมเงิน", value: sumOf("topup"), color: "text-slate-900" },
    { label: "ยอดจ่ายให้ร้านรวม", value: sumOf("payment"), color: "text-slate-900" },
    { label: "ยอดถอนรวม", value: sumOf("withdrawal"), color: "text-slate-900" },
  ];
  //งานที่ต้องทำ + ลิงก์ไปหน้าที่จัดการ
  const todos = [
    { label: "คำขอถอนรออนุมัติ", count: pending, href: "/admin/withdrawals" },
    { label: "อนุมัติแล้ว รอบันทึกการโอน", count: toTransfer, href: "/admin/withdrawals" },
    { label: "Event ที่ยังไม่มี Organizer", count: noOrganizer, href: "/admin/events" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}><p className="text-sm text-slate-600">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p></Card>
        ))}
      </div>
      {/* จอใหญ่แบ่ง 2 ฝั่ง / มือถือเรียงลง */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>งานที่ต้องทำ</CardTitle>
          <ul className="mt-3 divide-y divide-slate-100">
            {todos.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center justify-between py-3 hover:text-blue-700">
                  <span className="text-slate-700">{t.label}</span>
                  {/* มีงานค้าง = ป้ายเหลือง / ไม่มี = เทา */}
                  <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${t.count > 0 ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-500"}`}>{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>ภาพรวมระบบ</CardTitle>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {role.map((r) => (
              <li key={r} className="flex justify-between py-2"><span className="text-slate-600">ผู้ใช้ {ROLE_LABEL[r]}</span><span className="font-medium text-slate-900">{users.filter((u) => u.role === r).length} คน</span></li>
            ))}
            <li className="flex justify-between py-2"><span className="text-slate-600">Event</span><span className="font-medium text-slate-900">{events.length} งาน</span></li>
            <li className="flex justify-between py-2"><span className="text-slate-600">ร้านค้าปิดขาย</span><span className="font-medium text-slate-900">{vendors.filter((v) => v.active).length} / {vendors.length} ร้าน</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
