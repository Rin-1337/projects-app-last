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
import { generateId, nowISO, readStore, updateStore } from "../storage";


export function listProducts(eventId: ID): MerchProduct[] {
 return readStore("merchProducts").filter((p) => p.eventId === eventId);
}

export function listActiveProducts(eventId: ID): MerchProduct[] {
  return readStore("merchProducts").filter(
    (p) => p.eventId === eventId && p.active,
  );
}

export function saveProduct(product: MerchProduct): MerchProduct {
  if (product.name.trim() === ""){
    throw new Error("กรุณากรอกชื่อสินค้า");
  }
  if (!(product.price > 0)) {
    throw new Error("ราคาต้องมากกว่า 0");
  }
  if (product.variants.some((v) => v.stock < 0)) {
    throw new Error("สต็อกต้องไม่ติดลบ");
  }

  const exists =
    product.id !== "" &&
    readStore("merchProducts").some((p) => p.id === product.id);
  
  if (exists) {
    updateStore("merchProducts", (list) =>
      list.map((p) => (p.id === product.id ? { ...p, ...product } : p)),
    );
    return product;
  }
  const created: MerchProduct = {
    ...product,
    id: generateId("mp"),
    createdAt: nowISO(),
  };
  updateStore("merchProducts", (list) => [...list, created]);
  return created;
}

export function deleteProduct(productId: ID): void {
  const product = readStore("merchProducts").find((p) => p.id === productId);
  if (!product) {
    throw new Error("ไม่พบสินค้านี้");
  }

  const everSold = readStore("merchOrders").some((o) =>
    o.items.some((item) => item.productId === productId),
  );

  if (everSold) {
    updateStore("merchProducts", (list) =>
      list.map((p) => (p.id === productId ? { ...p, active: false } : p)),
    );
    return;
  }

  updateStore("merchProducts", (list) =>
    list.filter((p) => p.id !== productId),
  );
}
/** เช็กตะกร้า แล้วคืนรายการที่ใช้ราคาจริงจากระบบ (ไม่เชื่อราคาที่หน้าเว็บส่งมา) */
function checkItems(eventId: ID, items: MerchOrderItem[]): MerchOrderItem[] {
  if (items.length === 0) {
    throw new Error("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
  }
  const products = readStore("merchProducts");

  return items.map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("จำนวนต้องเป็นจำนวนเต็มมากกว่า 0");
    }
    const product = products.find(
      (p) => p.id === item.productId && p.eventId === eventId,
    );
    if (!product || !product.active) {
      throw new Error("ไม่พบสินค้านี้ หรือสินค้าปิดขายแล้ว");
    }
    const variant = product.variants.find((v) => v.size === item.size);
    if (!variant) {
      throw new Error(`ไม่พบไซส์ ${item.size} ของ ${product.name}`);
    }
    if (variant.stock < item.quantity) {
      throw new Error(
        `${product.name} ไซส์ ${item.size} เหลือ ${variant.stock} ชิ้น`,
      );
    }
    return { ...item, unitPrice: product.price };
  });
}
/** ลูกค้าสั่งซื้อออนไลน์ (ชำระ QR) — ตัดสต็อกเมื่อชำระสำเร็จ */
export function createOnlineOrder(input: {
  eventId: ID;
  customerId: ID;
  items: MerchOrderItem[];
  shippingAddress: string;
}): MerchOrder {
  const { eventId, customerId, items, shippingAddress } = input;

  if (shippingAddress.trim() === "") {
    throw new Error("กรุณากรอกที่อยู่จัดส่ง");
  }
  const checked = checkItems(eventId, items);
  const total = checked.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const order: MerchOrder = {
    id: generateId("mo"),
    eventId,
    customerId,
    channel: "online",
    items:checked,
    total,
    paymentMethod: "qr",
    paymentStatus: "pending",
    shippingAddress,
    shippingStatus: "pending",
    createdAt: nowISO(),
  };
  updateStore("merchOrders", (list) => [...list, order]);

  return order;
}

/** จำลองลูกค้าจ่าย QR สำเร็จ — ตัดสต็อกและเปลี่ยนเป็น paid */
export function confirmOnlinePayment(orderId: ID): MerchOrder {
  const order = readStore("merchOrders").find((o) => o.id === orderId);
  if (!order) {
    throw new Error("ไม่พบคำสั่งซื้อนี้");
  }
  if (order.paymentStatus !== "pending") {
    throw new Error("คำสั่งซื้อนี้ไม่ได้รอชำระเงิน");
  }

  const products = readStore("merchProducts");

  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error("ไม่พบสินค้าในคำสั่งซื้อ");
    }
    const variant = product.variants.find((v) => v.size === item.size);
    if (!variant) {
      throw new Error(`ไม่พบไซส์ ${item.size} ของ ${product.name}`);
    }
    if (variant.stock < item.quantity) {
      throw new Error(
        `${product.name} ไซส์ ${item.size} เหลือ ${variant.stock} ชิ้น`,
      );
    }
  }

  updateStore("merchProducts", (list) =>
    list.map((p) => {
      const bought = order.items.filter((item) => item.productId === p.id);
      if (bought.length === 0) return p;
      return {
        ...p,
        variants: p.variants.map((v) => {
          const qty = bought
            .filter((item) => item.size === v.size)
            .reduce((sum, item) => sum + item.quantity, 0);
          return { ...v, stock: v.stock - qty };
        }),
      };
    }),
  );

  const paid: MerchOrder = {
    ...order,
    paymentStatus: "paid",
    shippingStatus: "preparing",
  };
  updateStore("merchOrders", (list) =>
    list.map((o) => (o.id === orderId ? paid : o)),
  );

  return paid;
}


/** ขายหน้าบูท (เงินสด / QR) — ตัดสต็อกทันที */
export function recordBoothSale(input: {
  eventId: ID;
  items: MerchOrderItem[];
  paymentMethod: "cash" | "qr";
}): MerchOrder {
  const { eventId, items, paymentMethod } = input;

  const checked = checkItems(eventId, items);
  
  const total = checked.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  updateStore("merchProducts", (list) =>
    list.map((p) => {
      const sold = checked.filter((item) => item.productId === p.id);
      if (sold.length === 0) return p;
      return {
        ...p,
        variants: p.variants.map((v) => {
          const qty = sold
            .filter((item) => item.size === v.size)
            .reduce((sum, item) => sum + item.quantity, 0);
          return { ...v, stock: v.stock - qty };
        }),
      };
    }),
  );

  const order: MerchOrder = {
    id: generateId("mo"),
    eventId,
    customerId: null,
    channel: "booth",
    items: checked,
    total,
    paymentMethod,
    paymentStatus: "paid",
    createdAt: nowISO(),
  };
  updateStore("merchOrders", (list) => [...list, order]);

  return order;
}

export function updateShipping(
  orderId: ID,
  status: ShippingStatus,
  trackingNo?: string,
): MerchOrder {
  const order = readStore("merchOrders").find((o) => o.id === orderId);
  if (!order) {
    throw new Error("ไม่พบคำสั่งซื้อนี้");
  }
  if (order.channel !== "online") {
    throw new Error("คำสั่งซื้อหน้าบูทไม่มีการจัดส่ง");
  }
  if (order.paymentStatus !== "paid") {
    throw new Error("คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน");
  }

  const updated: MerchOrder = {
    ...order,
    shippingStatus: status,
    trackingNo: trackingNo ?? order.trackingNo,
  };
  updateStore("merchOrders", (list) =>
    list.map((o) => (o.id === orderId ? updated : o)),
  );

  return updated;
}

export function listOrdersByCustomer(customerId: ID): MerchOrder[] {
  return readStore("merchOrders").filter((o) => o.customerId === customerId)
}
