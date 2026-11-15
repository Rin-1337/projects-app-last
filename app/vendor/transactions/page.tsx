"use client";

import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Badge, Card, CardTitle } from "@/components/ui";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorTransactionsPage() {
  const { user } = useAuth();
  // ธุรกรรมทั้งหมด + รายชื่อผู้ใช้ (ไว้หาชื่อลูกค้า)
  const transactions = useStore("tokenTransactions");
  const users = useStore("users");

  if (!user) return <p className="text-slate-500">กำลงโหลด...</p>;
  const myId = user.id; // wallet ร้านผูกกับ userId

  // ธุรกรรมที่เกี่ยวกับร้านนี้ (เป้นผู้รับหรือผู้จ่าย) ใหม่สุดขึ้นก่อน
  const myTx = transactions.filter((tx) => tx.fromUserId === myId || tx.toUserId === myId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // รายการขาย = payment ที่ร้านเป็นผู้รับ
  const sales = myTx.filter((tx) => tx.type === "payment" && tx.toUserId === myId);
  // reduce = บวกยอดทุกรายการรวมกัน เริ่มจาก 0
  const totalSales = sales.reduce((sum, tx) => sum + tx.amount, 0);
  const totalWithdrawn = myTx.filter((tx) => tx.type === "withdrawal").reduce((sum, tx) => sum + tx.amount, 0);

  // หาชื่อลูกค้าจาก userId
  function customerName(userId: string | null) {
    return users.find((u) => u.id === userId)?. name ?? "-";
  }
  return (
    <div className="space-y-6">
      {/* การ์ดสรุป 3 ใบ (มือถือเรียงลง / จอใหญ่เรียง 3 คอลัมน์) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-slate-600">ขายไปแล้ว</p><p className="text-2xl font-bold text-slate-900">{sales.length} ครั้ง</p></Card>
        <Card><p className="text-sm text-slate-600">รับ Token รวม</p><p className="text-2xl font-bold text-green-700">+{totalSales.toLocaleString()}</p></Card>
        <Card><p className="text-sm text-slate-600">ถอนออกรวม</p><p className="text-2xl font-bold text-slate-900">-{totalWithdrawn.toLocaleString()}</p></Card>
      </div>
      <Card>
        <CardTitle>รายการทั้งหมด</CardTitle>
        {myTx.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">ยังไม่มีธุรกรรม</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {myTx.map((tx) => {
              const isSale = tx.type === "payment";
              return (
                <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={isSale ? "green" : "blue"}>{isSale ? "ขาย" : "ถอนเงิน"}</Badge>
                      {/* ขาย → "หมูปิ้ง ×2 · ชื่อลูกค้า" (note มาจาก sellToCustomer) */}
                      <p className="font-medium text-slate-900">{isSale ? `${tx.note ?? "-"} · ${customerName(tx.fromUserId)}` : "โอนเข้าบัญชีธนาคาร"}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{new Date(tx.createdAt).toLocaleString("th-TH")}</p>
                  </div>
                  {/* รับ = เขียว + / ถอน = ดำ - */}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
