"use client";

import { useSyncExternalStore } from "react";

/**
 * useCart — ตะกร้าสินค้าของลูกค้า เก็บใน localStorage
 * ใช้ร่วมกันระหว่างหน้าร้าน (/customer/shop) และหน้าสั่งซื้อ (/customer/shop/checkout)
 *
 * ทำไมเก็บใน localStorage
 *   ถ้าใช้ useState ธรรมดา พอรีเฟรชหน้าหรือเปลี่ยนไปหน้า checkout ตะกร้าจะหายทันที
 *
 * ในตะกร้าเก็บแค่ "รหัสสินค้า + ไซซ์ + จำนวน" ไม่เก็บชื่อหรือราคา
 *   ชื่อและราคาจะไปหาจากข้อมูลสินค้าล่าสุดตอนแสดงผล
 *   ถ้าผู้จัดงานแก้ราคา ตะกร้าก็แสดงราคาใหม่ให้เอง
 *
 * กติกา: ตะกร้า 1 ใบ ใส่ได้เฉพาะสินค้าของงานเดียว
 *   เพราะ createOnlineOrder() สร้างคำสั่งซื้อได้ทีละงาน (รับ eventId ตัวเดียว)
 *
 * วิธีใช้
 *   const { cart, addItem, changeQuantity, removeItem, clearCart } = useCart(user.id);
 */

export interface CartItem {
  productId: string;
  /** เช่น "M" หรือ "FREE" */
  size: string;
  quantity: number;
}

export interface Cart {
  /** งานที่สินค้าในตะกร้าสังกัดอยู่ ("" = ตะกร้าว่าง ยังไม่ผูกกับงานไหน) */
  eventId: string;
  items: CartItem[];
}

/** ชื่อ event ที่ใช้บอกทุกหน้าว่า "ตะกร้าเปลี่ยนแล้ว ให้อ่านใหม่" */
const CART_CHANGE_EVENT = "customer-cart-change";

const EMPTY_CART: Cart = { eventId: "", items: [] };

/** ผู้ใช้แต่ละคนมีตะกร้าของตัวเอง (กันสลับบัญชีแล้วเห็นตะกร้าของคนอื่น) */
function getCartKey(userId: string) {
  return "customer_cart_" + userId;
}

/** อ่านตะกร้าเป็นข้อความ JSON ตรง ๆ จาก localStorage (ไม่มี = null) */
function readCartText(userId: string) {
  try {
    return window.localStorage.getItem(getCartKey(userId));
  } catch {
    // บาง browser (เช่นโหมดส่วนตัว) อาจห้ามใช้ localStorage
    return null;
  }
}

/** แปลงข้อความ JSON กลับเป็นตะกร้า ถ้าอ่านไม่ออกให้ถือว่าตะกร้าว่าง */
function parseCart(text: string | null): Cart {
  if (text === null) {
    return EMPTY_CART;
  }
  try {
    return JSON.parse(text) as Cart;
  } catch {
    return EMPTY_CART;
  }
}

/** บันทึกตะกร้า แล้วแจ้งทุก component ที่ใช้ useCart ให้วาดหน้าจอใหม่ */
function saveCart(userId: string, cart: Cart) {
  try {
    window.localStorage.setItem(getCartKey(userId), JSON.stringify(cart));
  } catch {
    // บันทึกไม่ได้ก็ไม่เป็นไร ตะกร้าจะหายตอนรีเฟรชเท่านั้น
  }
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

/** ให้ React คอยฟังว่าตะกร้าเปลี่ยน (ทั้งจากหน้านี้ และจากแท็บอื่นผ่าน event "storage") */
function subscribe(callback: () => void) {
  window.addEventListener(CART_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCart(userId: string) {
  // useSyncExternalStore = วิธีของ React สำหรับอ่านข้อมูลที่อยู่นอก React (ที่นี่คือ localStorage)
  // ค่าที่ 2 = อ่านบน browser, ค่าที่ 3 = บน server (server ไม่มี localStorage จึงถือว่าตะกร้าว่าง)
  // อ่านออกมาเป็นข้อความ เพราะข้อความเดิมเทียบกันได้ตรง ๆ React จะได้ไม่วาดหน้าซ้ำโดยไม่จำเป็น
  const cartText = useSyncExternalStore(
    subscribe,
    () => readCartText(userId),
    () => null,
  );
  const cart = parseCart(cartText);

  /**
   * ใส่สินค้าลงตะกร้า
   * - ถ้ามีสินค้าเดียวกันไซซ์เดียวกันอยู่แล้ว → บวกจำนวนเพิ่ม
   * - ถ้าเป็นสินค้าของงานอื่น → เริ่มตะกร้าใหม่ (หน้าร้านจะถามยืนยันลูกค้าก่อนเรียกฟังก์ชันนี้)
   */
  function addItem(eventId: string, productId: string, size: string, quantity: number) {
    let items = cart.items;
    if (cart.eventId !== eventId) {
      items = [];
    }

    const found = items.find((item) => item.productId === productId && item.size === size);

    let newItems: CartItem[];
    if (found) {
      newItems = items.map((item) => {
        if (item.productId === productId && item.size === size) {
          return { ...item, quantity: item.quantity + quantity };
        }
        return item;
      });
    } else {
      newItems = [...items, { productId, size, quantity }];
    }

    saveCart(userId, { eventId, items: newItems });
  }

  /** ปุ่ม + / − ในตะกร้า (change = 1 หรือ -1) ถ้าลดจนเหลือ 0 จะเอาออกจากตะกร้า */
  function changeQuantity(productId: string, size: string, change: number) {
    const updated = cart.items.map((item) => {
      if (item.productId === productId && item.size === size) {
        return { ...item, quantity: item.quantity + change };
      }
      return item;
    });
    const remaining = updated.filter((item) => item.quantity > 0);

    if (remaining.length === 0) {
      saveCart(userId, EMPTY_CART);
    } else {
      saveCart(userId, { eventId: cart.eventId, items: remaining });
    }
  }

  /** ปุ่มลบรายการออกจากตะกร้า */
  function removeItem(productId: string, size: string) {
    const remaining = cart.items.filter(
      (item) => !(item.productId === productId && item.size === size),
    );

    if (remaining.length === 0) {
      saveCart(userId, EMPTY_CART);
    } else {
      saveCart(userId, { eventId: cart.eventId, items: remaining });
    }
  }

  /** ล้างตะกร้า (ใช้หลังชำระเงินสำเร็จ) */
  function clearCart() {
    saveCart(userId, EMPTY_CART);
  }

  return { cart, addItem, changeQuantity, removeItem, clearCart };
}
