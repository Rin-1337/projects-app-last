"use client";

import Link from "next/link";
import { useState } from "react";
import { AddressForm } from "@/components/customer/checkout/AddressForm";
import { MerchPaymentModal } from "@/components/customer/checkout/MerchPaymentModal";
import { OrderSummary } from "@/components/customer/checkout/OrderSummary";
import { getCartRows } from "@/components/customer/shop/getCartRows";
import { useCart } from "@/components/customer/shop/useCart";
import { useAuth } from "@/lib/auth";
import { createOnlineOrder } from "@/lib/services/merch";
import type { MerchOrder } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { PAGE_TITLE_SM } from "@/components/customer/common/styles";

// หน้าสั่งซื้อเสื้อและของที่ระลึก — ผู้รับผิดชอบ: ทิวากร
//
// ขั้นตอนบนหน้านี้
//   1. กรอกที่อยู่ (AddressForm) + ดูสรุปรายการ (OrderSummary)
//   2. กดยืนยัน → createOnlineOrder() ได้คำสั่งซื้อสถานะ "รอชำระ" (ยังไม่ตัดสต็อก)
//   3. หน้าต่าง QR (MerchPaymentModal) → กดจำลองชำระสำเร็จ → ตัดสต็อก
//   4. ล้างตะกร้า แล้วแสดงข้อความสั่งซื้อสำเร็จ

export default function CustomerCheckoutPage() {
  const { user } = useAuth();
  const events = useStore("events");
  const products = useStore("merchProducts");

  // คำสั่งซื้อที่รอจ่าย (มีค่า = เปิดหน้าต่าง QR)
  const [pendingOrder, setPendingOrder] = useState<MerchOrder | null>(null);
  // คำสั่งซื้อที่จ่ายแล้ว (มีค่า = สั่งซื้อสำเร็จ)
  const [paidOrder, setPaidOrder] = useState<MerchOrder | null>(null);
  // error จากการสร้างคำสั่งซื้อ
  const [orderError, setOrderError] = useState("");

  // ต้องเรียก hook ก่อน if (!user) เพราะกติกาของ React ห้ามเรียก hook หลัง return
  let userId = "";
  if (user) {
    userId = user.id;
  }
  const { cart, clearCart } = useCart(userId);

  if (!user) {
    return null; // RoleGuard ใน layout รับประกันว่าล็อกอินแล้ว
  }

  // ───── 4. สั่งซื้อสำเร็จ (เช็กก่อน เพราะตอนนี้ตะกร้าถูกล้างไปแล้ว) ─────
  if (paidOrder) {
    return (
      <div className="mx-auto max-w-300 px-5 pt-6 pb-24 sm:px-10">
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-base-200 p-8 text-center">
          <p className="text-xl text-success">ชำระเงินสำเร็จ</p>
          <p className="text-sm text-base-content/60">
            เลขคำสั่งซื้อ {paidOrder.id} · ยอด {paidOrder.total.toLocaleString()} บาท
          </p>
          <p className="text-sm text-base-content/60">ผู้จัดงานกำลังเตรียมสินค้าเพื่อจัดส่ง</p>
          <div className="flex justify-center gap-2 pt-2">
            <Link href="/customer/orders" className="btn btn-neutral font-normal">
              ดูประวัติคำสั่งซื้อ
            </Link>
            <Link href="/customer/shop" className="btn bg-base-100 font-normal">
              ซื้อสินค้าเพิ่ม
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rows = getCartRows(cart.items, products);

  // ───── ตะกร้าว่าง ─────
  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-300 px-5 pt-6 pb-24 sm:px-10">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-base-200 p-8 text-center">
          <p className="text-base-content/60">ยังไม่มีสินค้าในตะกร้า</p>
          <Link href="/customer/shop" className="btn btn-neutral font-normal">
            ไปเลือกซื้อสินค้า
          </Link>
        </div>
      </div>
    );
  }

  let eventTitle = "";
  const cartEvent = events.find((event) => event.id === cart.eventId);
  if (cartEvent) {
    eventTitle = cartEvent.title;
  }

  // ───── 2. กดยืนยันคำสั่งซื้อ ─────
  function handleSubmitAddress(shippingAddress: string) {
    // ส่งแค่รหัสสินค้า ไซซ์ จำนวน — ราคาจริง service จะดึงจากระบบเอง (unitPrice ที่ส่งไปจะถูกแทนที่)
    const items = rows.map((row) => {
      return {
        productId: row.productId,
        size: row.size,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
      };
    });

    // createOnlineOrder จะ throw Error ถ้าข้อมูลไม่ผ่าน เช่น สินค้าเหลือไม่พอ
    try {
      const order = createOnlineOrder({
        eventId: cart.eventId,
        customerId: userId,
        items,
        shippingAddress,
      });
      setOrderError("");
      setPendingOrder(order);
    } catch (err) {
      if (err instanceof Error) {
        setOrderError(err.message);
      } else {
        setOrderError("สั่งซื้อไม่สำเร็จ");
      }
    }
  }

  // ───── 3. จ่ายเงินสำเร็จ ─────
  function handlePaid(order: MerchOrder) {
    setPendingOrder(null);
    setPaidOrder(order);
    clearCart();
  }

  // เบอร์โทรจากโปรไฟล์ (ถ้ามี) ใส่ไว้ในฟอร์มให้ก่อน
  let defaultPhone = "";
  if (user.phone) {
    defaultPhone = user.phone;
  }

  return (
    <div className="mx-auto max-w-300 space-y-10 px-5 pt-6 pb-24 sm:px-10">
      <h1 className={PAGE_TITLE_SM}>สั่งซื้อสินค้า.</h1>

      {/* ───── 1. ที่อยู่ (ซ้าย) + สรุปรายการ (ขวา, บนมือถืออยู่ด้านบน) ───── */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:order-2 lg:col-span-2">
          <OrderSummary eventTitle={eventTitle} rows={rows} />
        </div>
        <div className="lg:order-1 lg:col-span-3">
          <AddressForm
            defaultName={user.name}
            defaultPhone={defaultPhone}
            submitError={orderError}
            onSubmit={handleSubmitAddress}
          />
        </div>
      </div>

      {/* กดยกเลิกในหน้าต่าง QR = ปิดหน้าต่าง ตะกร้ายังอยู่ กดยืนยันใหม่ได้ */}
      {pendingOrder && (
        <MerchPaymentModal
          order={pendingOrder}
          onPaid={handlePaid}
          onCancel={() => setPendingOrder(null)}
        />
      )}
    </div>
  );
}
