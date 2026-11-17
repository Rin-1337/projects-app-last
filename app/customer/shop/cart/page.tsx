"use client";

/**
 * หน้าตะกร้าสินค้า — ผู้รับผิดชอบ: ทิวากร
 * เพิ่ม-ลด-ลบสินค้า ดูราคารวม แล้วกด "สั่งซื้อ" เพื่อไปหน้ากรอกที่อยู่
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/components/customer/CartContext";
import { CheckoutSteps } from "@/components/customer/CheckoutSteps";
import { QuantityStepper } from "@/components/customer/QuantityStepper";
import { Button, Card } from "@/components/ui";
import { useStore } from "@/lib/useStore";

export default function CustomerCartPage() {
  const router = useRouter();
  const cart = useCart();

  // ---- ตะกร้าว่าง ----
  if (cart.items.length === 0) {
    return (
      <div className="space-y-6">
        <CheckoutSteps current={0} />
        <Card className="space-y-4 text-center">
          <p className="text-slate-500">ยังไม่มีสินค้าในตะกร้า</p>
          <Link href="/customer/shop" className="text-blue-600 hover:underline">
            ← กลับไปเลือกสินค้า
          </Link>
        </Card>
      </div>
    );
  }

  // ---- มีสินค้า ----
  return (
    <div className="space-y-6">
      <CheckoutSteps current={0} />
      <h1 className="text-2xl font-bold text-slate-900">ตะกร้าสินค้า</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ซ้าย: รายการสินค้า */}
        <Card className="divide-y divide-slate-100 p-0 lg:col-span-2">
          {cart.items.map((item) => (
            <CartRow key={item.productId + item.size} item={item} />
          ))}
        </Card>

        {/* ขวา: สรุปยอด */}
        <Card className="h-fit space-y-3">
          <h2 className="font-semibold text-slate-900">สรุปคำสั่งซื้อ</h2>

          <div className="flex justify-between text-sm text-slate-600">
            <span>ราคาสินค้า ({cart.totalQuantity} ชิ้น)</span>
            <span>{cart.subtotal.toLocaleString()} บาท</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>ค่าจัดส่ง</span>
            <span>ฟรี</span>
          </div>

          <hr className="border-slate-200" />

          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>ยอดรวมทั้งหมด</span>
            <span>{cart.subtotal.toLocaleString()} บาท</span>
          </div>

          <Button size="lg" className="w-full" onClick={() => router.push("/customer/shop/checkout")}>
            สั่งซื้อ
          </Button>
          <Button variant="ghost" className="w-full" onClick={cart.clearCart}>
            ล้างตะกร้า
          </Button>
        </Card>
      </div>
    </div>
  );
}

/** สินค้า 1 แถวในตะกร้า:  ชื่อ / ไซซ์ / ราคาต่อชิ้น   [− 2 +]   ราคารวมแถว   [ลบ] */
function CartRow({ item }: { item: CartItem }) {
  const cart = useCart();
  const products = useStore("merchProducts");

  // หาสต็อกล่าสุด เพื่อไม่ให้กด + เกินของที่มี
  const product = products.find((p) => p.id === item.productId);
  const stock = product?.variants.find((v) => v.size === item.size)?.stock ?? 0;

  const lineTotal = item.unitPrice * item.quantity;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-40 flex-1">
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-sm text-slate-500">
          ไซซ์ {item.size} · {item.unitPrice.toLocaleString()} บาท/ชิ้น
        </p>
      </div>

      <QuantityStepper
        value={item.quantity}
        max={stock}
        onChange={(newQuantity) => cart.setQuantity(item.productId, item.size, newQuantity)}
      />

      <p className="w-24 text-right font-semibold text-slate-900">{lineTotal.toLocaleString()} ฿</p>

      <Button variant="ghost" size="sm" onClick={() => cart.removeItem(item.productId, item.size)}>
        ลบ
      </Button>
    </div>
  );
}
