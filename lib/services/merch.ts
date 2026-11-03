/**
 * lib/services/merch.ts — เสื้อและของที่ระลึกของ Organizer
 * เจ้าของ: อรอนงค์ (Organizer – Merchandise)
 * ข้อมูลที่ดูแล: merchProducts, merchOrders
 *
 * ทิวากร (Customer) เรียก listActiveProducts / createOnlineOrder / listOrdersByCustomer
 */
import type {
  ID,
  MerchOrder,
  MerchOrderItem,
  MerchProduct,
  ShippingStatus,
} from "../types";
import { notImplemented } from "./_todo";

export function listProducts(eventId: ID): MerchProduct[] {
  void eventId;
  return notImplemented("listProducts");
}

export function listActiveProducts(eventId: ID): MerchProduct[] {
  void eventId;
  return notImplemented("listActiveProducts");
}

export function saveProduct(product: MerchProduct): MerchProduct {
  void product;
  return notImplemented("saveProduct");
}

export function deleteProduct(productId: ID): void {
  void productId;
  notImplemented("deleteProduct");
}

/** ลูกค้าสั่งซื้อออนไลน์ (ชำระ QR) — ตัดสต็อกเมื่อชำระสำเร็จ */
export function createOnlineOrder(input: {
  eventId: ID;
  customerId: ID;
  items: MerchOrderItem[];
  shippingAddress: string;
}): MerchOrder {
  void input;
  return notImplemented("createOnlineOrder");
}

/** ขายหน้าบูท (เงินสด / QR) — ตัดสต็อกทันที */
export function recordBoothSale(input: {
  eventId: ID;
  items: MerchOrderItem[];
  paymentMethod: "cash" | "qr";
}): MerchOrder {
  void input;
  return notImplemented("recordBoothSale");
}

export function updateShipping(
  orderId: ID,
  status: ShippingStatus,
  trackingNo?: string,
): MerchOrder {
  void orderId;
  void status;
  void trackingNo;
  return notImplemented("updateShipping");
}

export function listOrdersByCustomer(customerId: ID): MerchOrder[] {
  void customerId;
  return notImplemented("listOrdersByCustomer");
}
