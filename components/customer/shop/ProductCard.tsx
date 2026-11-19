"use client";

import Image from "next/image";
import { useState } from "react";
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
    <article className="flex flex-col gap-3.5">
      {/* รูปสินค้า (ถ้าไม่มีรูป แสดงกล่องสีเทาแทน) */}
      <div className="relative aspect-square overflow-hidden rounded-md bg-base-200">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-base-content/60">ไม่มีรูปสินค้า</div>
        )}
        {isSoldOut && (
          <span className="absolute top-3.5 right-3.5 rounded-full bg-white px-3 py-1.5 text-[13px] text-[#B42318]">
            สินค้าหมด
          </span>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium">{product.name}</h3>
          {product.description && <p className="text-sm text-base-content/60">{product.description}</p>}
        </div>
        <p className="text-base whitespace-nowrap">{product.price.toLocaleString()} บาท</p>
      </div>

      {!isSoldOut && (
        <>
          {/* 1. เลือกไซซ์ (ไซซ์ที่หมดจะขีดฆ่า กดไม่ได้) */}
          {hasSizes && (
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map((variant) => {
                const isSelected = variant.size === selectedSize;
                let style = "border-base-300 bg-base-100";
                if (isSelected) {
                  style = "border-base-content bg-base-content text-base-100";
                }
                return (
                  <button
                    key={variant.size}
                    type="button"
                    disabled={variant.stock <= 0}
                    onClick={() => selectSize(variant.size)}
                    aria-pressed={isSelected}
                    className={`h-10 min-w-11 rounded-full border px-3 text-sm disabled:cursor-not-allowed disabled:border-dashed disabled:text-base-content/40 disabled:line-through ${style}`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. จำนวน + ใส่ตะกร้า */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="ลดจำนวน"
              className="btn btn-circle btn-sm bg-base-200 font-normal"
              onClick={() => setQuantity(quantity - 1)}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="w-5 text-center text-sm">{quantity}</span>
            <button
              type="button"
              aria-label="เพิ่มจำนวน"
              className="btn btn-circle btn-sm bg-base-200 font-normal"
              onClick={() => setQuantity(quantity + 1)}
              disabled={quantity >= canAddMore}
            >
              +
            </button>
            <span className="flex-1 text-[13px] text-base-content/60">เหลือ {stock} ชิ้น</span>
            <button
              type="button"
              className="btn btn-neutral h-11 px-5.5 text-sm font-normal"
              onClick={handleAdd}
              disabled={canAddMore <= 0}
            >
              {canAddMore <= 0 ? "ครบแล้ว" : "ใส่ตะกร้า"}
            </button>
          </div>

          {quantityInCart > 0 && <p className="text-[13px] text-base-content/60">อยู่ในตะกร้าแล้ว {quantityInCart} ชิ้น</p>}
        </>
      )}
    </article>
  );
}
