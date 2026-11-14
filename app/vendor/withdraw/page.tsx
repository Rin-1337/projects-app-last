"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Badge, Button, Card, CardTitle, Input, STATUS_TONE } from "@/components/ui";
import { getVendorByUser } from "@/lib/services/vendors";
import { requestWithdrawal } from "@/lib/services/withdrawals";
import type { WithdrawalStatus } from "@/lib/types";

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว รอโอน",
  rejected: "ไม่อนุมัติ",
  transferred: "โอนแล้ว",
};

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorWithdrawPage() {
  const { user } = useAuth();
  // อ่านข้อมูลแบบ reactive (ต้องอยู่ก่อน return ทุกตัว)
  const wallets = useStore("wallets");
  const allAccounts = useStore("bankAccounts");
  const allWithdrawals = useStore("withdrawals");
  // state ของฟอร์ม
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [error, setError] = useState("");
  const [success, setSucess] = useState("");

  if (!user) return <p className="text-slate-500">กำลังโหลด...</p>;
  const vendor = getVendorByUser(user.id);
  if (!vendor) return (<Card><p className="text-slate-600">บัญชีนี้ยังไม่มีร้าน กรุณาติดต่อ Admin</p></Card>);

  // ยอด Token ของร้าน (wallet ผูกกับ userId ของร้าน)
  const balance = wallets.find((w) => w.userId === user.id)?.balance ?? 0;
  // บัญชีของร้านนี้ เอาบัญชีหลักขึ้นก่อน
  const accounts = allAccounts.filter((a) => a.vendorId === vendor.id).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  // ถ้ายังไม่ได้เลือก ใช้บัญชีแรก (บัญชีหลัก)
  const selectedId = bankAccountId || accounts[0]?.id || "";
  // คำขอถอนของร้านนี้ ใหม่สุดอยู่บน
  const myWithdrawals = allWithdrawals.filter((w) => w.vendorId === vendor.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  // คำขอที่ยังค้างอยู่ (ห้ามขอซ้ำ)
  const openRequest = myWithdrawals.find((w) => w.status === "pending" || w.status === "approved");
  // หาชื่อบัญชีจาก id
  function accountLabel(id: string) {
    const a = allAccounts.find((b) => b.id === id);
    return a ? `${a.bankName} · ${a.accountNumber}` : "-";
  }

  // กดปุ่ม "ส่งคำขอถอน"
  function handleRequest() {
    setError(""); setSucess("");
    if (!vendor) return; // ให้ TS รู้ว่า vendor มีค่าแน่นอน
    try {
      // กฏทั้งหมด (ยอดพอมั้ย, บัญชีถูกมั้ย, มีคำขอค้างมั้ย) อยู่ใน withdrawals.ts
      requestWithdrawal({ vendorId: vendor.id, amount: Number(amount), bankAccountId: selectedId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งคำขอไม่สำเร็จ");
      return;
    }
    setSucess(`ส่งคำขอถอน ${Number(amount).toLocaleString()} บาทแล้ว รอ Admin อนุมัติ`);
    setAmount("");
  }
  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-slate-600">Token ที่ถอนได้</p>
        <p className="text-3xl font-bold text-slate-900">{balance.toLocaleString()} <span className="text-base font-normal text-slate-600">Token = {balance.toLocaleString()} บาท</span></p>
      </Card>
      <Card>
        <CardTitle>ขอถอนเงิน</CardTitle>
        {accounts.length === 0 ? (
          // ยังไม่มีบัญชี > พาไปเพิ่มก่อน
          <p className="mt-2 text-sm text-slate-600">ยังไม่มีบัญชีธนาคาร <Link href="/vendor/bank" className="text-blue-600 underline">เพิ่มบัญชีก่อน</Link></p>
        ) : openRequest ? (
          // มีคำขอค้าง > ขอใหม่ได้
          <p className="mt-2 text-sm text-slate-600">มีคำขอถอน {openRequest.amount.toLocaleString()} <Badge tone={STATUS_TONE[openRequest.status]}>{STATUS_LABEL[openRequest.status]}</Badge> รอให้เสร็จก่อนจึงขอใหม่ได้</p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <Input label="จำนวนที่ถอน (บาท)" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Button variant="secondary" onClick={() => setAmount(String(balance))}>ถอนทั้งหมด</Button>
            </div>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              โอนเข้าบัญชี
              <select value={selectedId} onChange={(e) => setBankAccountId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900">
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.bankName} · {a.accountNumber}{a.isDefault ? " (บัญชีหลัก)" : ""}</option>))}
              </select>
            </label>
            <Button onClick={handleRequest}>ส่งคำขอถอน</Button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-700">{success}</p>}
      </Card>
      <Card>
        <CardTitle>ประวัติคำขอ</CardTitle>
        {myWithdrawals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">ยังไม่เคยขอถอนเงิน</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {myWithdrawals.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{w.amount.toLocaleString()} บาท</p>
                  {/* วันที่ขอ + บัญชีที่จะโอนเข้า */}
                  <p className="text-sm text-slate-600">{new Date(w.requestedAt).toLocaleString("th-TH")} · {accountLabel(w.bankAccountId)}</p>
                  {/* ถูกปฏิเสธ > โชว์เหตุผล */}
                  {w.status === "rejected" && w.rejectReason && <p className="text-sm text-red-600">เหตุผล: {w.rejectReason}</p>}
                  {/* โอนแล้ว > โชว์เลขอ้างอิง */}
                  {w.status === "transferred" && w.transferRef && <p className="text-sm text-green-700">เลขอ้างอิง {w.transferRef}</p>}
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
