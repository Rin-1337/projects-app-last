"use client";

import Link from "next/link";
import { SHIPPING_LABEL, SHIPPING_TONE } from "@/components/customer/merchStatus";
import { Badge, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";

// หน้าประวัติรายการ (คำสั่งซื้อเสื้อ/ของที่ระลึก) — ผู้รับผิดชอบ: ทิวากร

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const orders = useStore("merchOrders");
  const products = useStore("merchProducts");

  if (!user) return null;

  const myOrders = orders
    .filter((o) => o.customerId === user.id && o.channel === "online")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // ล่าสุดขึ้นก่อน

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "-";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">ประวัติรายการ</h1>

      {myOrders.length === 0 && (
        <Card className="text-center text-slate-500">ยังไม่มีคำสั่งซื้อ</Card>
      )}

      {myOrders.map((order) => {
        const status = order.shippingStatus ?? "pending";
        return (
          <Link key={order.id} href={`/customer/orders/${order.id}`} className="block">
            <Card className="flex flex-wrap items-center justify-between gap-3 hover:border-blue-300">
              <div>
                <p className="text-xs text-slate-400">
                  #{order.id} · {new Date(order.createdAt).toLocaleString("th-TH")}
                </p>
                <p className="font-medium text-slate-900">
                  {order.items.map((i) => `${productName(i.productId)} ×${i.quantity}`).join(", ")}
                </p>
                {order.trackingNo && (
                  <p className="text-sm text-slate-500">เลขพัสดุ: {order.trackingNo}</p>
                )}
              </div>
              <div className="text-right">
                <Badge tone={SHIPPING_TONE[status]}>{SHIPPING_LABEL[status]}</Badge>
                <p className="mt-1 font-semibold text-slate-900">{order.total.toLocaleString()} บาท</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
