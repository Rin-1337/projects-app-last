"use client";

import { useState } from "react";
import { getPublishedEvents } from "@/components/customer/common/getPublishedEvents";
import { CartPanel } from "@/components/customer/shop/CartPanel";
import { getCartRows } from "@/components/customer/shop/getCartRows";
import { ProductCard } from "@/components/customer/shop/ProductCard";
import { useCart } from "@/components/customer/shop/useCart";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { PAGE_TITLE } from "@/components/customer/common/styles";

// หน้าเสื้อและของที่ระลึก — ผู้รับผิดชอบ: ทิวากร
//
// ขั้นตอนการซื้อ
//   1. หน้านี้        : เลือกงาน → เลือกสินค้า ไซซ์ จำนวน → ใส่ตะกร้า
//   2. ตะกร้า (ขวามือ) : แก้จำนวน / ลบ / ดูราคารวม → กด "สั่งซื้อ"
//   3. /customer/shop/checkout : กรอกที่อยู่ → ยืนยันคำสั่งซื้อ → ชำระด้วย QR
//
// สินค้าแยกตามงาน และตะกร้าใส่ได้ทีละงาน (ดูเหตุผลใน components/customer/shop/useCart.ts)
// หน้าตาแบบ Posh (daisyUI theme posh)

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

  // จำนวนชิ้นทั้งหมดในตะกร้า (โชว์บนปุ่ม "ดูตะกร้า" ของมือถือ)
  let cartCount = 0;
  for (const item of cart.items) {
    cartCount += item.quantity;
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
    <div className="px-5 pt-6 pb-24 sm:px-10">
      <h1 className={PAGE_TITLE}>ของที่ระลึก.</h1>
      <p className="mt-3 mb-8 text-base text-base-content/60">สินค้าแยกตามงาน ตะกร้าสั่งซื้อได้ทีละงาน</p>

      {eventsWithProducts.length === 0 && (
        <p className="rounded-3xl bg-base-200 p-6 text-center text-base-content/60">ตอนนี้ยังไม่มีสินค้าวางขาย</p>
      )}

      {/* ───── เลือกงาน ───── */}
      {eventsWithProducts.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2">
          {eventsWithProducts.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setPickedEventId(event.id)}
              aria-pressed={event.id === currentEventId}
              className={`btn h-11 px-5 text-sm font-normal ${event.id === currentEventId ? "btn-neutral" : "bg-base-200"}`}
            >
              {event.title}
            </button>
          ))}
        </div>
      )}

      {message && <p className="mb-4 text-sm text-success">{message}</p>}

      {eventsWithProducts.length > 0 && (
        <div className="flex flex-wrap items-start gap-10">
          {/* ───── รายการสินค้า (ซ้าย 2 ส่วน) ───── */}
          <div className="grid min-w-0 flex-[999_1_560px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-5 gap-y-10">
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
          {/* id="cart" ให้ปุ่ม "ดูตะกร้า" ของมือถือเลื่อนลงมาที่นี่ */}
          <div id="cart" className="max-w-100 min-w-0 flex-[1_1_320px] scroll-mt-4 space-y-2 lg:sticky lg:top-4">
            {cart.items.length > 0 && cart.eventId !== currentEventId && (
              <p className="text-xs text-warning">ตะกร้านี้เป็นของงาน &quot;{cartEventTitle}&quot;</p>
            )}
            <CartPanel rows={cartRows} onChangeQuantity={changeQuantity} onRemove={removeItem} />
          </div>
        </div>
      )}

      {/* ───── ปุ่มลอย "ดูตะกร้า" เฉพาะมือถือ (lg:hidden) เพราะตะกร้าไปอยู่ล่างสุดของหน้า ───── */}
      {cartCount > 0 && (
        <a href="#cart" className="btn btn-neutral fixed right-5 bottom-5 z-40 h-12 rounded-full px-5 font-normal shadow-lg lg:hidden">
          ดูตะกร้า ({cartCount})
        </a>
      )}
    </div>
  );
}
