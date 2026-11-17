"use client";

/**
 * หน้ากรอกที่อยู่ + ชำระเงิน — ผู้รับผิดชอบ: ทิวากร
 *
 * ขั้นตอนในหน้านี้
 *   1. กรอกที่อยู่ แล้วกด "ไปชำระเงิน"
 *   2. createOnlineOrder   → ได้คำสั่งซื้อสถานะ "รอชำระเงิน"
 *   3. เปิดหน้าต่าง QR     → กดจ่าย → confirmOnlinePayment (ตัดสต็อก)
 *   4. ไปหน้า /customer/orders/[id] เพื่อติดตามพัสดุ
 */

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/customer/CartContext";
import { CheckoutSteps } from "@/components/customer/CheckoutSteps";
import { MerchPaymentModal } from "@/components/customer/MerchPaymentModal";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { createOnlineOrder } from "@/lib/services/merch";
import type { MerchOrder } from "@/lib/types";

export default function CustomerCheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();

  // ---- ช่องในฟอร์ม ----
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [postcode, setPostcode] = useState("");

  const [error, setError] = useState("");
  // order มีค่า = สร้างคำสั่งซื้อแล้ว → เปิดหน้าต่างชำระเงิน
  const [order, setOrder] = useState<MerchOrder | null>(null);

  if (!user) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // กันหน้ารีเฟรชตอนกด submit
    setError("");

    // ตรวจข้อมูลเพิ่มเติม (ช่องว่างตรวจด้วย required ในฟอร์มแล้ว)
    if (postcode.length !== 5) {
      setError("รหัสไปรษณีย์ต้องมี 5 หลัก");
      return;
    }

    // ใน types.ts ที่อยู่เป็น string ช่องเดียว จึงนำทุกช่องมาต่อกัน
    const fullAddress = `${name} โทร ${phone} — ${address} จ.${province} ${postcode}`;

    // แปลงของในตะกร้าให้เป็นรูปแบบที่ service ต้องการ
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    try {
      const newOrder = createOnlineOrder({
        eventId: cart.items[0].eventId,
        customerId: user!.id,
        items: orderItems,
        shippingAddress: fullAddress,
      });
      cart.clearCart(); // สร้างคำสั่งซื้อแล้ว ล้างตะกร้ากันสั่งซ้ำ
      setOrder(newOrder);
    } catch (err) {
      // service จะ throw Error เช่น สินค้าหมด
      setError(err instanceof Error ? err.message : "สั่งซื้อไม่สำเร็จ");
    }
  }

  function goToOrderPage() {
    router.push(`/customer/orders/${order!.id}`);
  }

  return (
    <div className="space-y-6">
      <CheckoutSteps current={order ? 2 : 1} />
      <h1 className="text-2xl font-bold text-slate-900">ที่อยู่จัดส่ง</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* ซ้าย: ฟอร์มที่อยู่ */}
        <Card className="space-y-4 lg:col-span-2">
          <Input label="ชื่อผู้รับ" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="เบอร์โทร" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="ที่อยู่" required value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="จังหวัด" required value={province} onChange={(e) => setProvince(e.target.value)} />
          <Input
            label="รหัสไปรษณีย์"
            required
            maxLength={5}
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
          />
        </Card>

        {/* ขวา: สรุปคำสั่งซื้อ */}
        <Card className="h-fit space-y-3">
          <h2 className="font-semibold text-slate-900">สรุปคำสั่งซื้อ</h2>

          {cart.items.map((item) => (
            <div key={item.productId + item.size} className="flex justify-between text-sm text-slate-600">
              <span>
                {item.name} ({item.size}) × {item.quantity}
              </span>
              <span>{(item.unitPrice * item.quantity).toLocaleString()} ฿</span>
            </div>
          ))}

          <hr className="border-slate-200" />

          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>ยอดรวม</span>
            <span>{cart.subtotal.toLocaleString()} บาท</span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={cart.items.length === 0}>
            ไปชำระเงิน
          </Button>
        </Card>
      </form>

      {/* หน้าต่างชำระเงิน (จ่ายแล้ว หรือกด "ชำระภายหลัง" ก็ไปหน้าคำสั่งซื้อเหมือนกัน) */}
      {order && <MerchPaymentModal order={order} onPaid={goToOrderPage} onCancel={goToOrderPage} />}
    </div>
  );
}
