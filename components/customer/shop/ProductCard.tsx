"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import type { MerchProduct } from "@/lib/types";
import type { CartItem } from "./useCart";

/**
 * การ์ดสินค้า 1 ชิ้นในหน้าร้าน
 * เลือกไซซ์ → เลือกจำนวน → กด "ใส่ตะกร้า"
 *
 * จำนวนที่เลือกได้ = สต็อก − จำนวนที่อยู่ในตะกร้าแล้ว
 * (กันลูกค้าใส่ตะกร้าเกินของที่มีจริง)
 */
export function ProductCard({
  product,
  itemsInCart,
  onAdd,
}: {
  product: MerchProduct;
  /** รายการในตะกร้าของสินค้าชิ้นนี้ (ทุกไซซ์) */
  itemsInCart: CartItem[];
  onAdd: (size: string, quantity: number) => void;
}) {
  // เริ่มต้นเลือกไซซ์แรกที่ยังมีของ
  const firstInStock = product.variants.find((v) => v.stock > 0);
  let firstSize = "";
  if (firstInStock) {
    firstSize = firstInStock.size;
  }

  const [selectedSize, setSelectedSize] = useState(firstSize);
  const [quantity, setQuantity] = useState(1);

  // ───── คำนวณว่าไซซ์ที่เลือกยังใส่ตะกร้าเพิ่มได้อีกกี่ชิ้น ─────
  const selectedVariant = product.variants.find((v) => v.size === selectedSize);
  let stock = 0;
  if (selectedVariant) {
    stock = selectedVariant.stock;
  }

  const inCart = itemsInCart.find((item) => item.size === selectedSize);
  let quantityInCart = 0;
  if (inCart) {
    quantityInCart = inCart.quantity;
  }

  const canAddMore = stock - quantityInCart;
  const isSoldOut = firstInStock === undefined;
  // สินค้าไซซ์เดียว (เช่น พวงกุญแจ "FREE") ไม่ต้องแสดงปุ่มเลือกไซซ์
  let hasSizes = true;
  if (product.variants.length === 1 && product.variants[0].size === "FREE") {
    hasSizes = false;
  }

  function selectSize(size: string) {
    setSelectedSize(size);
    setQuantity(1); // เปลี่ยนไซซ์แล้วเริ่มนับจำนวนใหม่
  }

  function handleAdd() {
    onAdd(selectedSize, quantity);
    setQuantity(1);
  }

  return (
    <Card className="flex flex-col p-0">
      {/* รูปสินค้า (ถ้าไม่มีรูป แสดงกล่องสีเทาแทน) */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-slate-100">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            ไม่มีรูปสินค้า
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-slate-900">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-sm text-slate-600">{product.description}</p>
          )}
          <p className="mt-2 text-lg font-bold text-slate-900">
            {product.price.toLocaleString()} บาท
          </p>
        </div>

        {isSoldOut && (
          <div>
            <Badge tone="red">สินค้าหมด</Badge>
          </div>
        )}

        {!isSoldOut && (
          <>
            {/* 1. เลือกไซซ์ */}
            {hasSizes && (
              <div>
                <p className="mb-1 text-xs text-slate-500">ไซซ์</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = variant.size === selectedSize;
                    const isEmpty = variant.stock <= 0;

                    let style = "border-slate-300 text-slate-700 hover:bg-slate-50";
                    if (isSelected) {
                      style = "border-blue-600 bg-blue-50 text-blue-700";
                    }

                    return (
                      <button
                        key={variant.size}
                        type="button"
                        disabled={isEmpty}
                        onClick={() => selectSize(variant.size)}
                        className={`min-w-10 rounded-lg border px-3 py-1 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${style}`}
                      >
                        {variant.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. เลือกจำนวน */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                −
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= canAddMore}
              >
                +
              </Button>
              <span className="text-xs text-slate-500">เหลือ {stock} ชิ้น</span>
            </div>

            {quantityInCart > 0 && (
              <p className="text-xs text-blue-700">อยู่ในตะกร้าแล้ว {quantityInCart} ชิ้น</p>
            )}

            {/* 3. ใส่ตะกร้า (ดันไว้ล่างสุดของการ์ด ปุ่มทุกการ์ดจะได้อยู่ระดับเดียวกัน) */}
            <Button className="mt-auto w-full" onClick={handleAdd} disabled={canAddMore <= 0}>
              {canAddMore <= 0 ? "ใส่ตะกร้าครบจำนวนที่มีแล้ว" : "ใส่ตะกร้า"}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
