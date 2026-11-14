"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Badge, Button, Card, CardTitle, Input, STATUS_TONE } from "@/components/ui";
import { approveWithdrawal, markTransferred, rejectWithdrawal } from "@/lib/services/withdrawals";
import type { ID, WithdrawalStatus } from "@/lib/types";

// ชื่อสถานะภาษาไทย (ชุดเดียวกับหน้า vendor)
const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติ รอโอน",
  rejected: "ไม่อนุมัติ",
  transferred: "โอนแล้ว",
};

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminWithdrawalsPage() {
  const { user } = useAuth();
  // อ่านข้อมูล reactive ทั้งหมด (ก่อน return)
  const withdrawals = useStore("withdrawals");
  const vendors = useStore("vendors");
  const wallets = useStore("wallets");
  const accounts = useStore("bankAccounts");
  // ช่องพิมพ์ของแต่ละคำขอ เก็บแยกตาม id → { "wd_1": "ข้อความ" }
  const [inputs, setInputs] = useState<Record<ID, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) return <p className="text-slate-500">กำลังโหลด...</p>;
  const adminId = user.id;

  // คำขอที่ยังค้าง (เก่าสุดขึ้นก่อน = มาก่อนได้ก่อน)
  const open = withdrawals.filter((w) => w.status === "pending" || w.status === "approved").sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  // คำขอที่จบแล้ว (ใหม่สุดขึ้นก่อน)
  const done = withdrawals.filter((w) => w.status === "rejected" || w.status === "transferred").sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  // หาร้านจาก id
  function vendorOf(vendorId: ID) { return vendors.find((v) => v.id === vendorId); }
  // ยอด Token ของร้าน (wallet ผูกกับ userId ของร้าน)
  function balanceOf(vendorId: ID) {
    const v = vendorOf(vendorId);
    return wallets.find((w) => w.userId === v?.userId)?.balance ?? 0;
  }
  // ข้อความบัญชีปลายทาง
  function accountLabel(id: ID) {
    const a = accounts.find((b) => b.id === id);
    return a ? `${a.bankName} · ${a.accountNumber} · ${a.accountName}` : "-";
  }
  // ตัวช่วยกดปุ่ม: ลองทำ → ถ้า error โชว์แดง → ถ้าผ่านโชว์เขียว + ล้างช่องพิมพ์
  function run(action: () => void, message: string, id: ID) {
    setError(""); setSuccess("");
    try { action(); } catch (e) { setError(e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ"); return; }
    setSuccess(message);
    setInputs((prev) => ({ ...prev, [id]: "" }));
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>คำขอที่รอดำเนินการ ({open.length})</CardTitle>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
        {open.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">ไม่มีคำขอค้าง</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {open.map((w) => {
              const balance = balanceOf(w.vendorId);
              const text = inputs[w.id] ?? ""; // ข้อความในช่องของคำขอนี้
              return (
                <li key={w.id} className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{vendorOf(w.vendorId)?.shopName ?? "-"} · {w.amount.toLocaleString()} บาท</p>
                      <p className="text-sm text-slate-600">{accountLabel(w.bankAccountId)}</p>
                      {/* ยอดไม่พอ > ตัวแดง เตือน Admin */}
                      <p className={`text-sm ${balance < w.amount ? "text-red-600" : "text-slate-600"}`}>ยอด Token ร้านตอนนี้ {balance.toLocaleString()}</p>
                    </div>
                    <Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <Input
                      label={w.status === "pending" ? "เหตุผล (ถ้าไม่อนุมัติ)" : "เลขอ้างอิงการโอน / เหตุผล"}
                      value={text}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [w.id]: e.target.value }))}
                    />
                    {/* รออนุมัติ > ปุ่มอนุมัติ */}
                    {w.status === "pending" && (
                      <Button size="sm" onClick={() => run(() => approveWithdrawal(w.id, adminId), "อนุมัติแล้ว รอโอนเงิน", w.id)}>อนุมัติ</Button>
                    )}
                    {/* อนุมัติแล้ว > ปุ่มบันทึกการโอน (ตัด Token ตรงนี้) */}
                    {w.status === "approved" && (
                      <Button size="sm" onClick={() => run(() => markTransferred(w.id, adminId, text.trim()), "บันทึกการโอนแล้ว ตัด Token ร้านเรียบร้อย", w.id)}>บันทึกว่าโอนแล้ว</Button>
                    )}
                    {/* ไม่อนุมัติ ใช้ได้ทั้ง 2 สถานะ */}
                    <Button size="sm" variant="danger" onClick={() => run(() => rejectWithdrawal(w.id, adminId, text), "ปฏิเสธคำขอแล้ว", w.id)}>ไม่อนุมัติ</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card>
        <CardTitle>ประวัติที่ดำเนินการแล้ว</CardTitle>
        {done.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500"></p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {done.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{vendorOf(w.vendorId)?.shopName ?? "-"} · {w.amount.toLocaleString()} บาท</p>
                  <p className="text-sm text-slate-600">{new Date(w.requestedAt).toLocaleString("th-TH")}</p>
                  {/* ไม่อนุมัติ > มีเหตุผล / โอนแล้ว > มีเลขอ้างอิง */}
                  {w.rejectReason && <p className="text-sm text-red-600">เหตุผล: {w.rejectReason}</p>}
                  {w.transferRef && <p className="text-sm text-green-700">เลขอ้างอิง: {w.transferRef}</p>}
                </div>
                <Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
