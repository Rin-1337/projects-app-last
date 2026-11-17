import type { MerchProduct } from "@/lib/types";
import type { CartItem } from "./useCart";

/** 1 แถวในตะกร้า พร้อมข้อมูลที่ต้องใช้แสดงผล */
export interface CartRow {
  productId: string;
  size: string;
  quantity: number;
  name: string;
  image?: string;
  unitPrice: number;
  /** ราคารวมของแถวนี้ = ราคาต่อชิ้น × จำนวน */
  lineTotal: number;
  /** สต็อกที่เหลือของไซซ์นี้ ใช้จำกัดปุ่ม + */
  stock: number;
}

/**
 * เอาตะกร้า (ที่มีแค่รหัสสินค้า + ไซซ์ + จำนวน) มาจับคู่กับข้อมูลสินค้า
 * เพื่อให้ได้ชื่อ ราคา และสต็อกล่าสุด
 * ใช้ร่วมกันระหว่างตะกร้าในหน้าร้าน (CartPanel) และหน้าสั่งซื้อ (checkout)
 *
 * สินค้าที่ถูกลบหรือปิดขายไปแล้วจะไม่อยู่ในผลลัพธ์ จึงไม่ถูกนำไปสั่งซื้อ
 */
export function getCartRows(items: CartItem[], products: MerchProduct[]): CartRow[] {
  const rows: CartRow[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.active) {
      continue;
    }

    const variant = product.variants.find((v) => v.size === item.size);
    let stock = 0;
    if (variant) {
      stock = variant.stock;
    }

    rows.push({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
      stock,
    });
  }

  return rows;
}

/** รวมจำนวนชิ้นทั้งหมดในตะกร้า (ตัวเลขบนไอคอนตะกร้า) */
export function getTotalQuantity(rows: CartRow[]) {
  let total = 0;
  for (const row of rows) {
    total = total + row.quantity;
  }
  return total;
}

/** รวมราคาทั้งหมดในตะกร้า */
export function getTotalPrice(rows: CartRow[]) {
  let total = 0;
  for (const row of rows) {
    total = total + row.lineTotal;
  }
  return total;
}

/** แสดงชื่อไซซ์ให้อ่านง่าย ("FREE" = สินค้าที่ไม่มีไซซ์) */
export function getSizeLabel(size: string) {
  if (size === "FREE") {
    return "ไม่มีไซซ์";
  }
  return "ไซซ์ " + size;
}
