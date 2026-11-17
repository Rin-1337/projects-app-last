"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MerchPaymentModal } from "@/components/customer/MerchPaymentModal";
import { ShippingTimeline } from "@/components/customer/ShippingTimeline";
import { Button, Card, CardTitle } from "@/components/ui";
import { useStore } from "@/lib/useStore";

// หน้ารายละเอียดคำสั่งซื้อ + ติดตามพัสดุ — ผู้รับผิดชอบ: ทิวากร

export default function CustomerOrderDetailPage() {
  // useParams ต้องอยู่ใน Suspense (โปรเจคเปิด cacheComponents) เหมือนหน้า events/[id]
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-200" />}>
      <OrderDetail />
    </Suspense>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orders = useStore("merchOrders");
  const products = useStore("merchProducts");
  const [paying, setPaying] = useState(false);

  // อ่านจาก useStore → Organizer อัปเดตสถานะจากอีกแท็บ หน้านี้เปลี่ยนตามทันที
  const order = orders.find((o) => o.id === id);
  if (!order) return <Card>ไม่พบคำสั่งซื้อนี้</Card>;

  const productName = (pid: string) => products.find((p) => p.id === pid)?.name ?? "-";

  return (
    <div className="space-y-6">
      <Link href="/customer/orders" className="text-sm text-blue-600 hover:underline">
        ← ประวัติรายการ
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">คำสั่งซื้อ #{order.id}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>สถานะการจัดส่ง</CardTitle>
          <ShippingTimeline status={order.shippingStatus ?? "pending"} trackingNo={order.trackingNo} />
          {order.paymentStatus === "pending" && (
            <Button className="w-full" onClick={() => setPaying(true)}>
              ชำระเงิน {order.total.toLocaleString()} บาท
            </Button>
          )}
        </Card>

        <Card className="space-y-3">
          <CardTitle>รายการสินค้า</CardTitle>
          {order.items.map((i) => (
            <div key={`${i.productId}-${i.size}`} className="flex justify-between text-sm">
              <span>
                {productName(i.productId)} {i.size !== "FREE" && `(${i.size})`} × {i.quantity}
              </span>
              <span>{(i.unitPrice * i.quantity).toLocaleString()} ฿</span>
            </div>
          ))}
          <hr className="border-slate-200" />
          <div className="flex justify-between font-bold">
            <span>ยอดรวม</span>
            <span>{order.total.toLocaleString()} บาท</span>
          </div>
          <p className="pt-2 text-sm text-slate-500">ที่อยู่จัดส่ง: {order.shippingAddress}</p>
        </Card>
      </div>

      {paying && (
        <MerchPaymentModal order={order} onPaid={() => setPaying(false)} onCancel={() => setPaying(false)} />
      )}
    </div>
  );
}
