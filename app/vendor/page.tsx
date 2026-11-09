"use client";

import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Card, CardTitle } from "@/components/ui";
import { getVendorByUser } from "@/lib/services/vendors";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorPage() {
  const { user } = useAuth();

  // useStore = อ่านข้อมูล + อัปเดตหน้าเองเมื่อข้อมูลเปลี่ยน
  // (ต้องอยู่ก่อน if ... return เหมือน useState)
  const wallets = useStore("wallets");
  const transaction = useStore("tokenTransactions");

  // รายชื่อผู้ใช้ ไว้หาชื่อลูกค้าในรายการขาย
  const users = useStore("users");

  if (!user) {
    return <p className="text-slate-500">กำลังโหลด...</p>;
  }

  const vendor = getVendorByUser(user.id);
  if (!vendor) {
    return (
      <Card>
        <p className="text-slate-600">บัญชีนี้ยังไม่มีร้าน กรุณาติดต่อ Admin</p>
      </Card>
    );
  }
  // ยอด Token ของร้าน = กระเป๋าของบัญชีที่ล็อกอิน
  // .find หาใบที่ userId ตรง · ?.balance ถ้าไม่เจอกระเป๋าจะไม่ error · ?? 0 ไม่เจอ = 0
  const balance = wallets.find((w) => w.userId === user.id)?.balance ?? 0;
  
  // รายการขายของร้านนี้ = ธุรกรรมแบบ "payment" ที่ vendorid เป็นร้านเรา
  const sales = transaction.filter(
    (tx) => tx.type === "payment" && tx.vendorId === vendor.id,
  );

  // เฉพาะของวันนี้ -- แปลงเวลาเป็นวันที่ (เวลาเครื่อง) แล้วเทียบกับวันนี้
  const today = new Date().toDateString();
  const todaySales = sales.filter(
    (tx) => new Date(tx.createdAt).toDateString() === today,
  );

  // รวมยอด -- reduce บวก amount ทีละรายการ เริ่มจาก 0
  const totalAll = sales.reduce((sum, tx) => sum + tx.amount, 0);
  const totalToday = todaySales.reduce((sum, tx) => sum + tx.amount, 0);

  // 5 รายการล่าสุด - service ใส่รายการใหม่ไว้หน้าสุดอยู่แล้ว เลยตัด 5 ตัวแรกได้เลย
  const recentSales = sales.slice(0, 5);

  // หาชื่อลูกค้าจาก id (ไม่เจอ = แสดง "-")
  function customerName(userId: string | null) {
    return users.find((u) => u.id === userId)?.name ?? "-"
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{vendor.shopName}</h1>
      
      {/* การ์ดยอด Token */}
      <Card>
       <CardTitle>ยอด Token ของร้าน</CardTitle>
       <p className="text-3xl font-bold text-blue-600">{balance} Token</p>
       <p className="mt-1 text-sm text-slate-500">
        {vendor.productName} · {vendor.priceToken} Token / ชิ้น
       </p>
      </Card>

      {/* ยอดขาย 2 กล่องวางข้างกัน */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle>ขายวันนี้</CardTitle>
          <p className="text-2xl font-bold">{totalToday} Token</p>
          <p className="text-sm text-slate-500">{todaySales.length} รายการ</p>
        </Card>
        <Card>
          <CardTitle>ขายทั้งหมด</CardTitle>
          <p className="text-2xl font-bold">{totalAll} Token</p>
          <p className="text-sm text-slate-500">{sales.length} รายการ</p>
        </Card>
      </div>
      {/* รายการขายล่าสุด */}
      <Card>
        <CardTitle>ขายล่าสุด</CardTitle>

        {/* ยังไม่มีการขาย -> ข้อความเทา */}
        {recentSales.length === 0 && (
          <p className="text-slate-500">ยังไม่มีรายการขาย</p>
        )}

        {/* .map = วนทีละรายการ แล้วสร้าง <li> 1 แถว · key ช่วยให้ React จำแถวได้ */}
        <ul className="divide-y divide-slate-100">
          {recentSales.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between py-2">
              <div>
                <p>{customerName(tx.fromUserId)}</p>
                <p className="text-sm text-slate-500">
                  {tx.note} ·{" "}
                  {new Date(tx.createdAt).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <span className="font-semibold text-green-700">+{tx.amount}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
