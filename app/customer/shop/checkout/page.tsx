"use client";

import Link from "next/link";
import { useState } from "react";
import { AddressForm } from "@/components/customer/checkout/AddressForm";
import { MerchPaymentModal } from "@/components/customer/checkout/MerchPaymentModal";
import { OrderSummary } from "@/components/customer/checkout/OrderSummary";
import { getCartRows } from "@/components/customer/shop/getCartRows";
import { useCart } from "@/components/customer/shop/useCart";
import { Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { createOnlineOrder } from "@/lib/services/merch";
import type { MerchOrder } from "@/lib/types";
import { useStore } from "@/lib/useStore";

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
      <Card className="space-y-3 text-center">
        <p className="text-lg font-semibold text-green-700">ชำระเงินสำเร็จ</p>
        <p className="text-sm text-slate-600">
          เลขคำสั่งซื้อ {paidOrder.id} · ยอด {paidOrder.total.toLocaleString()} บาท
        </p>
        <p className="text-sm text-slate-600">ผู้จัดงานกำลังเตรียมสินค้าเพื่อจัดส่ง</p>
        <div className="flex justify-center gap-4 text-sm font-medium">
          <Link href="/customer/orders" className="text-blue-700 hover:underline">
            ดูประวัติคำสั่งซื้อ
          </Link>
          <Link href="/customer/shop" className="text-slate-600 hover:underline">
            ซื้อสินค้าเพิ่ม
          </Link>
        </div>
      </Card>
    );
  }

  const rows = getCartRows(cart.items, products);

  // ───── ตะกร้าว่าง ─────
  if (rows.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-slate-600">ยังไม่มีสินค้าในตะกร้า</p>
        <Link
          href="/customer/shop"
          className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          ไปเลือกซื้อสินค้า
        </Link>
      </Card>
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
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">สั่งซื้อสินค้า</h1>

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
