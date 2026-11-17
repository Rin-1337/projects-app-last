"use client";

import { useState } from "react";
import { getPublishedEvents } from "@/components/customer/common/getPublishedEvents";
import { CartPanel } from "@/components/customer/shop/CartPanel";
import { getCartRows } from "@/components/customer/shop/getCartRows";
import { ProductCard } from "@/components/customer/shop/ProductCard";
import { useCart } from "@/components/customer/shop/useCart";
import { Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";

// หน้าเสื้อและของที่ระลึก — ผู้รับผิดชอบ: ทิวากร
//
// ขั้นตอนการซื้อ
//   1. หน้านี้        : เลือกงาน → เลือกสินค้า ไซซ์ จำนวน → ใส่ตะกร้า
//   2. ตะกร้า (ขวามือ) : แก้จำนวน / ลบ / ดูราคารวม → กด "สั่งซื้อ"
//   3. /customer/shop/checkout : กรอกที่อยู่ → ยืนยันคำสั่งซื้อ → ชำระด้วย QR
//
// สินค้าแยกตามงาน และตะกร้าใส่ได้ทีละงาน (ดูเหตุผลใน components/customer/shop/useCart.ts)

export default function CustomerShopPage() {
  const { user } = useAuth();
  const events = useStore("events");
  const products = useStore("merchProducts");

  // งานที่ลูกค้ากดเลือกดูสินค้า ("" = ยังไม่ได้กดเลือก)
  const [pickedEventId, setPickedEventId] = useState("");
  // ข้อความแจ้งหลังใส่ตะกร้า
  const [message, setMessage] = useState("");

  // ต้องเรียก hook ก่อน if (!user) เพราะกติกาของ React ห้ามเรียก hook หลัง return
  // ถ้ายังไม่มี user จะใช้ "" ไปก่อน (RoleGuard ใน layout รับประกันว่าล็อกอินแล้ว)
  let userId = "";
  if (user) {
    userId = user.id;
  }
  const { cart, addItem, changeQuantity, removeItem } = useCart(userId);

  if (!user) {
    return null;
  }

  // ───── งานที่มีสินค้าขาย ─────
  const activeProducts = products.filter((product) => product.active);
  const eventsWithProducts = getPublishedEvents(events).filter((event) =>
    activeProducts.some((product) => product.eventId === event.id),
  );

  // งานที่กำลังแสดง: ถ้าลูกค้ากดเลือกไว้ใช้งานนั้น
  // ถ้ายังไม่ได้เลือก ให้เปิดงานที่มีของในตะกร้าก่อน ไม่งั้นเปิดงานแรก
  let currentEventId = pickedEventId;
  if (currentEventId === "") {
    if (cart.items.length > 0) {
      currentEventId = cart.eventId;
    } else if (eventsWithProducts.length > 0) {
      currentEventId = eventsWithProducts[0].id;
    }
  }

  const currentProducts = activeProducts.filter((product) => product.eventId === currentEventId);

  // แถวในตะกร้า (มีชื่อ ราคา สต็อก) + ชื่องานของตะกร้า ไว้เตือนถ้าตะกร้าเป็นของงานอื่น
  const cartRows = getCartRows(cart.items, products);
  let cartEventTitle = "";
  const cartEvent = events.find((event) => event.id === cart.eventId);
  if (cartEvent) {
    cartEventTitle = cartEvent.title;
  }

  function handleAdd(productId: string, productName: string, size: string, quantity: number) {
    // ตะกร้ามีของจากงานอื่นอยู่ → ถามก่อนว่าจะล้างตะกร้าไหม
    const isOtherEvent = cart.items.length > 0 && cart.eventId !== currentEventId;
    if (isOtherEvent) {
      const ok = window.confirm(
        `ตะกร้ามีสินค้าของงาน "${cartEventTitle}" อยู่\nสั่งซื้อได้ทีละงาน ต้องการล้างตะกร้าแล้วเริ่มใหม่ไหม?`,
      );
      if (!ok) {
        return;
      }
    }

    addItem(currentEventId, productId, size, quantity);
    setMessage(`ใส่ "${productName}" ลงตะกร้าแล้ว ${quantity} ชิ้น`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">เสื้อและของที่ระลึก</h1>

      {eventsWithProducts.length === 0 && (
        <Card className="text-center">
          <p className="text-slate-600">ตอนนี้ยังไม่มีสินค้าวางขาย</p>
        </Card>
      )}

      {/* ───── เลือกงาน ───── */}
      {eventsWithProducts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {eventsWithProducts.map((event) => {
            let style = "border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
            if (event.id === currentEventId) {
              style = "border-blue-600 bg-blue-600 text-white";
            }
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => setPickedEventId(event.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${style}`}
              >
                {event.title}
              </button>
            );
          })}
        </div>
      )}

      {message && <p className="text-sm text-green-700">{message}</p>}

      {eventsWithProducts.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ───── รายการสินค้า (ซ้าย 2 ส่วน) ───── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                itemsInCart={cart.items.filter((item) => item.productId === product.id)}
                onAdd={(size, quantity) => handleAdd(product.id, product.name, size, quantity)}
              />
            ))}
          </div>

          {/* ───── ตะกร้า (ขวา 1 ส่วน, บนมือถือจะอยู่ใต้รายการสินค้า) ───── */}
          <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
            {cart.items.length > 0 && cart.eventId !== currentEventId && (
              <p className="text-xs text-amber-700">
                ตะกร้านี้เป็นของงาน &quot;{cartEventTitle}&quot;
              </p>
            )}
            <CartPanel rows={cartRows} onChangeQuantity={changeQuantity} onRemove={removeItem} />
          </div>
        </div>
      )}
    </div>
  );
}
