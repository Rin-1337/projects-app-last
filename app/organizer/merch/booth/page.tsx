"use client";

import { useState } from "react";
import { Button, Card, CardTitle, Input } from "@/components/ui";
import { useStore } from "@/lib/useStore";
import { recordBoothSale } from "@/lib/services/merch";

// ผู้รับผิดชอบ: อรอนงค์
// ชั่วคราว ระหว่างรอระบบล็อกอินของปอ
const EVENT_ID = "ev_reunion";

type CartLine = { productId: string; size: string; quantity: number };

export default function OrganizerMerchBoothPage() {
  const allProducts = useStore("merchProducts");
  const products = allProducts.filter(
    (p) => p.eventId === EVENT_ID && p.active,
  );

  const [productId, setProductId] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState("");
  const [sellError, setSellError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr">("cash");

  // สินค้าที่เลือกอยู่ (ไม่เจอ = ยังไม่เลือก)
  const selected = products.find((p) => p.id === productId);
  // ยอดรวมของตะกร้า ใช้ราคาจากระบบ (ไม่ใช่ค่าที่ผู้ใช้กรอก)
  const total = cart.reduce((sum, line) => {
    const product = allProducts.find((p) => p.id === line.productId);
    return sum + (product?.price ?? 0) * line.quantity;
  }, 0);

  function handleSelectProduct(id: string) {
    setProductId(id);
    // เลือกสินค้าใหม่ → ตั้งไซส์เป็นไซส์แรกของสินค้านั้นให้เลย
    const product = products.find((p) => p.id === id);
    setSize(product?.variants[0]?.size ?? "");
    setError("");
  }

  function addToCart() {
    if (!selected) {
      setError("กรุณาเลือกสินค้า");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("จำนวนต้องเป็นจำนวนเต็มมากกว่า 0");
      return;
    }
    setError("");
    setCart((lines) => {
      const exists = lines.some(
        (l) => l.productId === selected.id && l.size === size,
      );
      // สินค้า+ไซส์เดิมมีในตะกร้าแล้ว → บวกจำนวนเพิ่ม ไม่สร้างบรรทัดซ้ำ
      if (exists) {
        return lines.map((l) =>
          l.productId === selected.id && l.size === size
            ? { ...l, quantity: l.quantity + qty }
            : l,
        );
      }
      return [...lines, { productId: selected.id, size, quantity: qty }];
    });
    setQuantity("1");
  }

  function removeLine(index: number) {
    setCart((lines) => lines.filter((_, i) => i !== index));
  }

  function handleSell() {
    setSuccess("");
    try {
      const items = cart.map((line) => {
        const product = allProducts.find((p) => p.id === line.productId);
        return {
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
          // service ดึงราคาจริงจากระบบเอง ค่านี้แค่ให้ type ครบ
          unitPrice: product?.price ?? 0,
        };
      });
      const order = recordBoothSale({
        eventId: EVENT_ID,
        items,
        paymentMethod,
      });
      setSellError("");
      setSuccess(`ขายสำเร็จ ยอด ${order.total} บาท`);
      setCart([]);
    } catch (err) {
      setSuccess("");
      setSellError(err instanceof Error ? err.message : "ขายไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>ขายหน้าบูท</CardTitle>

        {products.length === 0 ? (
          <p className="py-6 text-center text-slate-500">
            ยังไม่มีสินค้าที่เปิดขาย
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="product" className="text-sm text-slate-600">
                สินค้า
              </label>
              <select
                id="product"
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
                value={productId}
                onChange={(e) => handleSelectProduct(e.target.value)}
              >
                <option value="">— เลือกสินค้า —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price} บาท)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="size" className="text-sm text-slate-600">
                ไซส์
              </label>
              <select
                id="size"
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                {(selected?.variants ?? []).map((v) => (
                  <option key={v.size} value={v.size}>
                    {v.size} (เหลือ {v.stock})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="จำนวน"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <div className="sm:col-span-3">
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <Button onClick={addToCart}>ใส่ตะกร้า</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>ตะกร้า ({cart.length} รายการ)</CardTitle>
        {sellError && <p className="mb-2 text-sm text-red-600">{sellError}</p>}
        {success && <p className="mb-2 text-sm text-green-700">{success}</p>}
        {cart.length === 0 ? (
          <p className="py-6 text-center text-slate-500">ตะกร้าว่าง</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">สินค้า</th>
                  <th className="py-2 pr-4 font-medium">ไซส์</th>
                  <th className="py-2 pr-4 font-medium">จำนวน</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {cart.map((line, i) => (
                  <tr
                    key={`${line.productId}-${line.size}`}
                    className="border-b border-slate-100"
                  >
                    <td className="py-2 pr-4">
                      {allProducts.find((p) => p.id === line.productId)
                        ?.name ?? "-"}
                    </td>
                    <td className="py-2 pr-4">{line.size}</td>
                    <td className="py-2 pr-4">{line.quantity}</td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => removeLine(i)}
                      >
                        เอาออก
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-y-3">
              <p className="text-lg font-semibold">ยอดรวม {total} บาท</p>

              <div className="flex flex-col gap-1">
                <label htmlFor="payment" className="text-sm text-slate-600">
                  วิธีชำระเงิน
                </label>
                <select
                  id="payment"
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "cash" | "qr")
                  }
                >
                  <option value="cash">เงินสด</option>
                  <option value="qr">QR</option>
                </select>
              </div>
              <Button onClick={handleSell}>ยืนยันการขาย</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}