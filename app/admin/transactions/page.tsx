"use client";

import { useState } from "react";
import { useStore } from "@/lib/useStore";
import { Badge, Button, Card, CardTitle, Input } from "@/components/ui";
import type { TokenTxType, TopupChannel } from "@/lib/types";

// ชื่อ/สีของแต่ละประเภท
const TYPE_LABEL: Record<TokenTxType, string> = { topup: "เติม", payment: "จ่าย", withdrawal: "ถอน" };
const TYPE_TONE = { topup: "blue", payment: "green", withdrawal: "yellow" } as const;
// ช่องทางเติม
const CHANNEL_LABEL: Record<TopupChannel, string> = { online_qr: "ออนไลน์ QR", onsite_cash: "หน้างาน เงินสด", onsite_qr: "หน้างาน QR "};

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminTransactionsPage() {
  const transactions = useStore("tokenTransactions");
  const users = useStore("users");
  // ตัวกรอง: ประเภท + วันที่ (ใช้ในขั้น 2)
  const [type, setType] = useState<TokenTxType | "all">("all");
  const [date, setDate] = useState("");

  // หาชื่อผู้ใช้จาก id
  function nameOf(userId: string | null) {
    return users.find((u) => u.id === userId)?.name ?? "-";
  }
  // รวมยอดตามประเภท
  function sumOf(t: TokenTxType) {
    return transactions.filter((tx) => tx.type === t).reduce((sum, tx) => sum + tx.amount, 0);
  }

  const topup = sumOf("topup");
  const payment = sumOf("payment");
  const withdrawal = sumOf("withdrawal");
  const shown = transactions
    .filter((tx) => type === "all" || tx.type === type)
    // en-CA ให้รูปแบบ YYYY-MM-DD ตรงกับค่าจาก <input type="date">
    .filter((tx) => !date || new Date(tx.createdAt).toLocaleString("en-CA") === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="spate-y-6">
      {/* การ์ดสรุป 4 ใบ: มือถือ 1 / แท็บเล็ต 2 / จอใหญ่ 4 คอลัมน์ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols4">
        <Card><p className="text-sm text-slate-600">เติมเข้าระบบ</p><p className="text-2xl font-bold text-slate-900">{topup.toLocaleString()}</p></Card>
        <Card><p className="text-sm text-slate-600">จ่ายให้ร้าน</p><p className="text-2xl font-bold text-slate-900">{payment.toLocaleString()}</p></Card>
        <Card><p className="text-sm text-slate-600">ถอนออกจากระบบ</p><p className="text-2xl font-bold text-slate-900">{withdrawal.toLocaleString()}</p></Card>
        {/* Token ที่ยังอยู่ในระบบ = เติมเข้า - ถอนออก (จ่ายแค่ย้ายจากลูกค้าไปร้าน ไม่ได้หายไป) */}
        <Card><p className="text-sm text-slate-600">Token คงอยู่ในระบบ</p><p className="text-2xl font-bold text-blue-700">{(topup - withdrawal).toLocaleString()}</p></Card>
      </div>
      <Card>
        <CardTitle>รายการธุรกรรม ({shown.length})</CardTitle>
        {/* ปุ่มกรองประเภท (ปุ่มที่เลือกอยู่เป็นสีน้ำเงิน) + เลือกวันที่ */}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          {(["all", "topup", "payment", "withdrawal"] as const).map((t) => (
            <Button key={t} size="sm" variant={type === t ? "primary" : "secondary"} onClick={() => setType(t)}>
              {t === "all" ? "ทั้งหมด" : TYPE_LABEL[t]}
            </Button>
          ))}
          <Input label="วันที่" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {date && <Button size="sm" variant="ghost" onClick={() => setDate("")}>ล้างวันที่</Button>}
        </div>
        {shown.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">ไม่มีรายการ</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {shown.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={TYPE_TONE[tx.type]}>{TYPE_LABEL[tx.type]}</Badge>
                    <p className="font-medium text-slate-900">
                      {/* เติม: ใครได้ + ช่องทาง */}
                      {tx.type === "topup" && `${nameOf(tx.toUserId)} · ${tx.channel ? CHANNEL_LABEL[tx.channel] : "-"}`}
                      {/* จ่าย: ลูกค้า > ร้าน + สินค้า */}
                      {tx.type === "payment" && `${nameOf(tx.fromUserId)} → ${nameOf(tx.toUserId)}${tx.note ? ` · ${tx.note}` : ""}`}
                      {/* ถอน */}
                      {tx.type === "withdrawal" && `${nameOf(tx.fromUserId)} → บัญชีธนาคาร`}
                    </p>
                  </div>
                  {/* เวลา + Admin ที่ทำรายการ (ถ้ามี) */}
                  <p className="mt-1 text-sm text-slate-600">{new Date(tx.createdAt).toLocaleString("th-TH")}{tx.performedBy ? ` · โดย ${nameOf(tx.performedBy)}` : ""}</p>
                </div>
                <p className="font-semibold text-slate-900">{tx.amount.toLocaleString()} Token</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
