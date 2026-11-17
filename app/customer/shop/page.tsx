"use client";

import { CartLink } from "@/components/customer/CartLink";
import { getPublishedEvents } from "@/components/customer/getPublishedEvents";
import { MerchProductCard } from "@/components/customer/MerchProductCard";
import { Card } from "@/components/ui";
import { useStore } from "@/lib/useStore";

// หน้าเสื้อและของที่ระลึก — ผู้รับผิดชอบ: ทิวากร
//
// ขั้นตอนการสั่งซื้อทั้งหมด
//   1. /customer/shop           เลือกไซซ์ + จำนวน → เพิ่มลงตะกร้า   (หน้านี้)
//   2. /customer/shop/cart      เพิ่ม-ลด-ลบ ดูราคารวม → กด "สั่งซื้อ"
//   3. /customer/shop/checkout  กรอกที่อยู่ → createOnlineOrder → ชำระ QR
//   4. /customer/orders/[id]    ดูคำสั่งซื้อ + ติดตามสถานะการจัดส่ง

export default function CustomerShopPage() {
  const events = useStore("events");
  const products = useStore("merchProducts");

  // แสดงเฉพาะงานที่เปิดขาย และมีสินค้าเปิดขายอย่างน้อย 1 ชิ้น
  const sections = getPublishedEvents(events)
    .map((event) => ({
      event,
      products: products.filter((p) => p.eventId === event.id && p.active),
    }))
    .filter((section) => section.products.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">เสื้อและของที่ระลึก</h1>
        <CartLink />
      </div>

      {sections.length === 0 && (
        <Card className="text-center text-slate-500">ยังไม่มีสินค้าเปิดขาย</Card>
      )}

      {sections.map(({ event, products }) => (
        <section key={event.id} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">{event.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <MerchProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
