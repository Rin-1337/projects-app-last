"use client";

/**
 * การ์ดสินค้า 1 ชิ้น: เลือกไซซ์ → เลือกจำนวน → กดเพิ่มลงตะกร้า
 * ผู้รับผิดชอบ: ทิวากร
 */

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { MerchProduct } from "@/lib/types";
import { useCart } from "./CartContext";
import { QuantityStepper } from "./QuantityStepper";

export function MerchProductCard({ product }: { product: MerchProduct }) {
  const cart = useCart();

  // ไซซ์เริ่มต้น = ไซซ์แรกที่ยังมีของ
  const firstSizeInStock = product.variants.find((v) => v.stock > 0)?.size ?? "";

  const [size, setSize] = useState(firstSizeInStock);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // ---- คำนวณว่ายังเพิ่มได้อีกกี่ชิ้น ----
  const stock = product.variants.find((v) => v.size === size)?.stock ?? 0;
  const inCart =
    cart.items.find((item) => item.productId === product.id && item.size === size)
      ?.quantity ?? 0;
  const canAddMore = stock - inCart; // สต็อก − ที่อยู่ในตะกร้าแล้ว
  const isSoldOut = canAddMore <= 0;

  // สินค้าที่มีไซซ์เดียวชื่อ "FREE" (เช่น พวงกุญแจ) ไม่ต้องแสดงปุ่มเลือกไซซ์
  const showSizeButtons = product.variants[0]?.size !== "FREE";

  function selectSize(newSize: string) {
    setSize(newSize);
    setQuantity(1);
  }

  function handleAddToCart() {
    const error = cart.addItem({
      productId: product.id,
      eventId: product.eventId,
      name: product.name,
      size: size,
      unitPrice: product.price,
      quantity: quantity,
    });

    if (error) {
      setIsError(true);
      setMessage(error);
    } else {
      setIsError(false);
      setMessage(`เพิ่ม ${quantity} ชิ้นลงตะกร้าแล้ว`);
      setQuantity(1);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      {/* รูปสินค้า */}
      <div className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-4xl">
        👕
      </div>

      {/* ชื่อ + ราคา */}
      <div>
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        <p className="text-sm text-slate-500">{product.description}</p>
        <p className="mt-1 text-lg font-bold text-blue-700">
          {product.price.toLocaleString()} บาท
        </p>
      </div>

      {/* ปุ่มเลือกไซซ์ */}
      {showSizeButtons && (
        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => (
            <SizeButton
              key={variant.size}
              label={variant.size}
              selected={variant.size === size}
              disabled={variant.stock === 0}
              onClick={() => selectSize(variant.size)}
            />
          ))}
        </div>
      )}

      {/* จำนวน */}
      <div className="flex items-center gap-3">
        <QuantityStepper value={quantity} max={canAddMore} onChange={setQuantity} />
        <span className="text-xs text-slate-500">เหลือ {stock} ชิ้น</span>
      </div>

      {/* ปุ่มเพิ่มลงตะกร้า */}
      <Button onClick={handleAddToCart} disabled={isSoldOut}>
        {isSoldOut ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
      </Button>

      {message && (
        <p className={isError ? "text-sm text-red-600" : "text-sm text-green-700"}>{message}</p>
      )}
    </Card>
  );
}

/** ปุ่มไซซ์ 1 ปุ่ม เช่น [ M ] */
function SizeButton({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const color = selected
    ? "border-blue-600 bg-blue-50 text-blue-700"
    : "border-slate-300 text-slate-700";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-1 text-sm disabled:opacity-40 ${color}`}
    >
      {label}
    </button>
  );
}
