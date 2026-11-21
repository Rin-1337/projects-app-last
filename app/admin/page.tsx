"use client";

import Link from "next/link";
import { useStore } from "@/lib/useStore";
import { Badge, Card, CardTitle } from "@/components/ui";
import type { Role } from "@/lib/types";
import { ACTION_LABEL, ROLE_LABEL, actionTone } from "./audit-logs/labels";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminPage() {
  // อ่านทุก store ที่ต้องใช้ (อัปเดตทันทีเมื่อข้อมูลเปลี่ยน)
  const users = useStore("users");
  const wallets = useStore("wallets");
  const transactions = useStore("tokenTransactions");
  const withdrawals = useStore("withdrawals");
  const events = useStore("events");
  const vendors = useStore("vendors");
  const ticketOrders = useStore("ticketOrders");
  const tickets = useStore("tickets");
  const merchOrders = useStore("merchOrders");
  const ticketTypes = useStore("ticketTypes");
  const logs = useStore("auditLogs");

  // role ของเจ้าของ id (ใช้แยกกระเป๋าลูกค้า / ร้านค้า)
  const roleOf = (userId: string) => users.find((u) => u.id === userId)?.role;
  // รวม Token ในกระเป๋าของ role ที่ระบุ
  const walletSum = (role: Role) => wallets.filter((w) => roleOf(w.userId) === role).reduce((sum, w) => sum + w.balance, 0);
  const customerToken = walletSum("customer");
  const vendorToken = walletSum("vendor");

  // ใช้จ่ายที่ร้านค้า (Token)
  const payments = transactions.filter((tx) => tx.type === "payment");
  const paymentTotal = payments.reduce((sum, tx) => sum + tx.amount, 0);
  // ถอนออกไปแล้ว (Token)
  const withdrawnTotal = transactions.filter((tx) => tx.type === "withdrawal").reduce((sum, tx) => sum + tx.amount, 0);
  // ยอดขายบัตร / ของที่ระลึก (บาท) นับเฉพาะที่จ่ายแล้ว
  const paidTicketOrders = ticketOrders.filter((o) => o.paymentStatus === "paid");
  const ticketRevenue = paidTicketOrders.reduce((sum, o) => sum + o.total, 0);
  const paidMerchOrders = merchOrders.filter((o) => o.paymentStatus === "paid");
  const merchRevenue = paidMerchOrders.reduce((sum, o) => sum + o.total, 0);

  // การ์ดยอด 4 ใบ (ไม่ซ้ำกัน: Token คงเหลือ / Token ที่ใช้ไป / เงินบาทจากบัตร / เงินบาทจากของที่ระลึก)
  const stats = [
    { label: "Token คงเหลือในระบบ", value: `${(customerToken + vendorToken).toLocaleString()} Token`, sub: `ลูกค้า ${customerToken.toLocaleString()} · ร้านค้า ${vendorToken.toLocaleString()}`, color: "text-violet-700" },
    { label: "ใช้จ่ายที่ร้านค้า", value: `${paymentTotal.toLocaleString()} Token`, sub: `${payments.length} รายการ`, color: "text-slate-900" },
    { label: "ยอดขายบัตร", value: `${ticketRevenue.toLocaleString()} บาท`, sub: `${tickets.length} ใบ · เช็กอินแล้ว ${tickets.filter((t) => t.checkedIn).length}`, color: "text-slate-900" },
    { label: "ยอดขายของที่ระลึก", value: `${merchRevenue.toLocaleString()} บาท`, sub: `${paidMerchOrders.length} คำสั่งซื้อ`, color: "text-slate-900" },
  ];

  // งานที่ต้องทำ + ลิงก์ไปหน้าที่จัดการ
  const todos = [
    { label: "คำขอถอนรออนุมัติ", count: withdrawals.filter((w) => w.status === "pending").length, href: "/admin/withdrawals" },
    { label: "อนุมัติแล้ว รอบันทึกการโอน", count: withdrawals.filter((w) => w.status === "approved").length, href: "/admin/withdrawals" },
    { label: "Event ที่ยังไม่มี Organizer", count: events.filter((e) => !e.organizerId).length, href: "/admin/events" },
  ];

  // ───── วันนี้ ─────
  // เทียบวันที่แบบ "YYYY-MM-DD" ตามเวลาเครื่อง
  const today = new Date().toLocaleDateString("en-CA");
  const isToday = (iso?: string) => !!iso && new Date(iso).toLocaleDateString("en-CA") === today;
  const todayLogs = logs.filter((log) => isToday(log.createdAt));
  const loginsToday = todayLogs.filter((log) => log.action === "auth.login").length;
  const failedToday = todayLogs.filter((log) => log.action === "auth.login_failed").length;
  const todayStats = [
    { label: "เติม Token วันนี้", value: `${transactions.filter((tx) => tx.type === "topup" && isToday(tx.createdAt)).reduce((s, tx) => s + tx.amount, 0).toLocaleString()} Token` },
    { label: "ขายบัตรวันนี้", value: `${paidTicketOrders.filter((o) => isToday(o.paidAt)).reduce((s, o) => s + o.quantity, 0)} ใบ` },
    { label: "สมาชิกใหม่วันนี้", value: `${users.filter((u) => isToday(u.createdAt)).length} คน` },
    { label: "เข้าสู่ระบบวันนี้", value: `${loginsToday} ครั้ง`, warn: failedToday > 0 ? `ไม่สำเร็จ ${failedToday} ครั้ง` : "" },
  ];

  // ───── Event ที่กำลังจะมาถึง (5 งานถัดไป) ─────
  // startAt เก็บเป็น ISO (UTC) เทียบเป็นข้อความได้เลย
  const now = new Date().toISOString();
  const upcoming = events
    .filter((e) => e.startAt >= now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 5)
    .map((e) => {
      const types = ticketTypes.filter((t) => t.eventId === e.id);
      const quota = types.reduce((s, t) => s + t.quota, 0);
      const sold = types.reduce((s, t) => s + t.sold, 0);
      const revenue = paidTicketOrders.filter((o) => o.eventId === e.id).reduce((s, o) => s + o.total, 0);
      const organizer = users.find((u) => u.id === e.organizerId)?.name ?? "ยังไม่มี";
      return { event: e, quota, sold, revenue, organizer, percent: quota > 0 ? Math.round((sold / quota) * 100) : 0 };
    });

  const recent = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const roles: Role[] = ["customer", "vendor", "organizer", "admin"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-slate-600">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* สรุปวันนี้ */}
      <Card>
        <CardTitle>วันนี้</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {todayStats.map((s) => (
            <div key={s.label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-600">{s.label}</p>
              <p className="text-xl font-semibold text-slate-900">{s.value}</p>
              {s.warn && <p className="text-xs text-red-600">{s.warn}</p>}
            </div>
          ))}
        </div>
      </Card>

      {/* จอใหญ่แบ่ง 2 ฝั่ง / มือถือเรียงลง */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>งานที่ต้องทำ</CardTitle>
          <ul className="divide-y divide-slate-100">
            {todos.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center justify-between py-3 hover:text-violet-700">
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
          <ul className="divide-y divide-slate-100 text-sm">
            {roles.map((r) => (
              <li key={r} className="flex justify-between py-2"><span className="text-slate-600">ผู้ใช้ {ROLE_LABEL[r]}</span><span className="font-medium text-slate-900">{users.filter((u) => u.role === r).length} คน</span></li>
            ))}
            <li className="flex justify-between py-2"><span className="text-slate-600">Event</span><span className="font-medium text-slate-900">{events.length} งาน</span></li>
            <li className="flex justify-between py-2"><span className="text-slate-600">ร้านค้าเปิดขาย</span><span className="font-medium text-slate-900">{vendors.filter((v) => v.active).length} / {vendors.length} ร้าน</span></li>
            <li className="flex justify-between py-2"><span className="text-slate-600">ร้านค้าถอนออกไปแล้ว</span><span className="font-medium text-slate-900">{withdrawnTotal.toLocaleString()} Token</span></li>
            <li className="flex justify-between py-2"><span className="text-slate-600">บัญชีที่ถูกระงับ</span><span className="font-medium text-slate-900">{users.filter((u) => u.status === "suspended").length} บัญชี</span></li>
          </ul>
        </Card>
      </div>

      {/* Event ที่กำลังจะมาถึง + ยอดขายบัตร */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Event ที่กำลังจะมาถึง</CardTitle>
          <Link href="/admin/events" className="text-sm text-violet-700 hover:underline">จัดการ Event →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">ไม่มี Event ที่กำลังจะจัด</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">งาน</th>
                  <th className="py-2 pr-4 font-medium">วันจัด</th>
                  <th className="py-2 pr-4 font-medium">Organizer</th>
                  <th className="py-2 pr-4 font-medium">ขายบัตรแล้ว</th>
                  <th className="py-2 text-right font-medium">รายได้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((u) => (
                  <tr key={u.event.id}>
                    <td className="py-2 pr-4 font-medium text-slate-900">{u.event.title}</td>
                    <td className="whitespace-nowrap py-2 pr-4 text-slate-600">{new Date(u.event.startAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className={`py-2 pr-4 ${u.event.organizerId ? "text-slate-600" : "text-amber-700"}`}>{u.organizer}</td>
                    <td className="py-2 pr-4">
                      {/* แถบความคืบหน้า: เกิน 90% = ใกล้เต็ม (สีส้ม) */}
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full ${u.percent >= 90 ? "bg-amber-500" : "bg-violet-600"}`} style={{ width: `${Math.min(u.percent, 100)}%` }} />
                        </div>
                        <span className="whitespace-nowrap text-slate-600">{u.sold}/{u.quota}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2 text-right text-slate-900">{u.revenue.toLocaleString()} บาท</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* กิจกรรมล่าสุด (ดูทั้งหมดที่ Audit Logs) */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>กิจกรรมล่าสุด</CardTitle>
          <Link href="/admin/audit-logs" className="text-sm text-violet-700 hover:underline">ดูทั้งหมด →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">ยังไม่มีกิจกรรม</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {recent.map((log) => {
              const user = users.find((u) => u.id === log.actorId);
              return (
                <li key={log.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="w-36 shrink-0 text-slate-500">{new Date(log.createdAt).toLocaleString("th-TH")}</span>
                  <Badge tone={actionTone(log.action)}>{ACTION_LABEL[log.action] ?? log.action}</Badge>
                  <span className="font-medium text-slate-900">{user?.name ?? log.actorId}</span>
                  {log.detail && <span className="text-slate-600">· {log.detail}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
