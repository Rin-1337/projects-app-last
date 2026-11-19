"use client";

import Link from "next/link";
import { useState } from "react";
import { MerchPaymentModal } from "@/components/customer/checkout/MerchPaymentModal";
import { MerchOrderCard } from "@/components/customer/orders/MerchOrderCard";
import { useAuth } from "@/lib/auth";
import type { MerchOrder } from "@/lib/types";
import { useStore } from "@/lib/useStore";
import { PAGE_TITLE_SM } from "@/components/customer/common/styles";

// หน้าประวัติคำสั่งซื้อเสื้อ/ของที่ระลึก — ผู้รับผิดชอบ: ทิวากร
//
// - แสดงคำสั่งซื้อออนไลน์ทั้งหมดของผู้ใช้ ล่าสุดขึ้นก่อน
// - แต่ละรายการบอกสถานะจัดส่ง + เลขพัสดุ (ผู้จัดงานเป็นคนอัปเดต)
// - คำสั่งซื้อที่ยังไม่จ่าย (เช่น กดปิดหน้าต่าง QR ไปก่อน) กด "ชำระเงิน" จ่ายต่อได้
//
// อ่านจาก useStore ตรง ๆ เพื่อให้สถานะเปลี่ยนเองทันทีเมื่อผู้จัดงานอัปเดตจากอีกแท็บ

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const events = useStore("events");
  const products = useStore("merchProducts");
  const orders = useStore("merchOrders");

  // คำสั่งซื้อที่กำลังจ่ายเงิน (มีค่า = เปิดหน้าต่าง QR)
  const [payingOrder, setPayingOrder] = useState<MerchOrder | null>(null);

  if (!user) {
    return null; // RoleGuard ใน layout รับประกันว่าล็อกอินแล้ว
  }

  // เก็บเฉพาะคำสั่งซื้อของผู้ใช้คนนี้ แล้วเรียงล่าสุดขึ้นก่อน
  const myOrders = orders
    .filter((order) => order.customerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  /** หาชื่องานจาก id (ถ้างานถูกลบไปแล้วจะแสดง "-") */
  function getEventTitle(eventId: string) {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      return event.title;
    }
    return "-";
  }

  return (
    <div className="mx-auto max-w-275 px-5 pt-6 pb-24 sm:px-10">
      <h1 className={PAGE_TITLE_SM}>ประวัติรายการ.</h1>
      <p className="mt-3 mb-10 text-base text-base-content/60">คำสั่งซื้อเสื้อและของที่ระลึก ล่าสุดขึ้นก่อน</p>

      {/* ───── ยังไม่เคยสั่งซื้อ ───── */}
      {myOrders.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-base-200 p-8 text-center">
          <p className="text-base-content/60">ยังไม่มีคำสั่งซื้อ</p>
          <Link href="/customer/shop" className="btn btn-neutral font-normal">
            ไปเลือกซื้อสินค้า
          </Link>
        </div>
      )}

      {/* ───── รายการคำสั่งซื้อ ───── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] gap-5">
        {myOrders.map((order) => (
          <MerchOrderCard
            key={order.id}
            order={order}
            eventTitle={getEventTitle(order.eventId)}
            products={products}
            onPay={() => setPayingOrder(order)}
          />
        ))}
      </div>

      {/* ───── หน้าต่าง QR (ใช้ตัวเดียวกับหน้าสั่งซื้อ) ───── */}
      {/* จ่ายสำเร็จแล้วแค่ปิดหน้าต่าง การ์ดจะเปลี่ยนสถานะเองเพราะอ่านจาก useStore */}
      {payingOrder && (
        <MerchPaymentModal
          order={payingOrder}
          onPaid={() => setPayingOrder(null)}
          onCancel={() => setPayingOrder(null)}
        />
      )}
    </div>
  );
}
