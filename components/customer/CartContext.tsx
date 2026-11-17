"use client";

/**
 * ตะกร้าสินค้า (เสื้อ/ของที่ระลึก) — ผู้รับผิดชอบ: ทิวากร
 *
 * วิธีใช้ในหน้าอื่น:
 *   const cart = useCart();
 *   cart.items          รายการในตะกร้า
 *   cart.totalQuantity  จำนวนชิ้นทั้งหมด
 *   cart.subtotal       ราคารวม
 *   cart.addItem(...)   cart.setQuantity(...)   cart.removeItem(...)   cart.clearCart()
 *
 * หมายเหตุ
 * - ตะกร้าอยู่ใน React state จะหายเมื่อรีเฟรชหน้า
 * - 1 ตะกร้า = สินค้าของงานเดียว (createOnlineOrder รับ eventId ได้ทีละงาน)
 */

import { createContext, useContext, useState, type ReactNode } from "react";

/* ───────────── 1. หน้าตาของข้อมูล ───────────── */

export interface CartItem {
  productId: string;
  eventId: string;
  name: string;
  size: string;
  unitPrice: number;
  quantity: number;
}

interface CartValue {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  addItem: (newItem: CartItem) => string | null;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  clearCart: () => void;
}

/* ───────────── 2. ตัวเก็บตะกร้า (ครอบไว้ที่ app/customer/layout.tsx) ───────────── */

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // ---- คำนวณตัวเลข ----

  let totalQuantity = 0;
  let subtotal = 0;
  for (const item of items) {
    totalQuantity += item.quantity;
    subtotal += item.unitPrice * item.quantity;
  }

  // ---- ฟังก์ชันจัดการตะกร้า ----

  /** สินค้าชิ้นเดียวกัน = รหัสสินค้าและไซซ์ตรงกัน */
  function isSameItem(item: CartItem, productId: string, size: string) {
    return item.productId === productId && item.size === size;
  }

  /** เพิ่มสินค้า — คืนข้อความ error ถ้าเพิ่มไม่ได้, คืน null ถ้าเพิ่มสำเร็จ */
  function addItem(newItem: CartItem) {
    const hasOtherEvent = items.length > 0 && items[0].eventId !== newItem.eventId;
    if (hasOtherEvent) {
      return "ตะกร้ามีสินค้าของงานอื่นอยู่ กรุณาสั่งซื้อหรือล้างตะกร้าก่อน";
    }

    const alreadyInCart = items.some((item) =>
      isSameItem(item, newItem.productId, newItem.size),
    );

    if (alreadyInCart) {
      // มีอยู่แล้ว → บวกจำนวนเพิ่ม
      setItems(
        items.map((item) =>
          isSameItem(item, newItem.productId, newItem.size)
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item,
        ),
      );
    } else {
      // ยังไม่มี → เพิ่มแถวใหม่
      setItems([...items, newItem]);
    }
    return null;
  }

  /** เปลี่ยนจำนวน (ถ้าเหลือ 0 จะลบออกจากตะกร้า) */
  function setQuantity(productId: string, size: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems(
      items.map((item) =>
        isSameItem(item, productId, size) ? { ...item, quantity } : item,
      ),
    );
  }

  function removeItem(productId: string, size: string) {
    setItems(items.filter((item) => !isSameItem(item, productId, size)));
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider
      value={{ items, totalQuantity, subtotal, addItem, setQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ───────────── 3. hook สำหรับเรียกใช้ตะกร้า ───────────── */

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error("useCart ต้องใช้ภายใน <CartProvider>");
  }
  return cart;
}
