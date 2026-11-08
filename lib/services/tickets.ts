/**
 * lib/services/tickets.ts — ซื้อบัตร ออก QR และ Check-in
 * เจ้าของ: วิริญา (Organizer – Event & Ticket)
 * ข้อมูลที่ดูแล: ticketOrders, tickets
 *
 * ทิวากร (Customer) เรียก createTicketOrder / confirmTicketPayment / listTicketsByCustomer
 */
import { generateId, nowISO, readStore, updateStore } from "../storage";
import type { ID, Ticket, TicketOrder } from "../types";
import { notImplemented } from "./_todo";

/**
 * createTicketOrder — สร้างคำสั่งซื้อสถานะ pending (ยังไม่ตัดโควตา)
 * ใครเรียก: หน้า /customer/events/[id] (ทิวากร) — เขียนให้ก่อนเพื่อให้ทดสอบหน้าซื้อบัตรได้
 *
 * ข้อมูลไม่ถูกต้องจะ throw Error พร้อมข้อความภาษาไทย ให้หน้าเว็บ try/catch แล้วแสดงข้อความนั้น
 */
export function createTicketOrder(input: {
  customerId: ID;
  ticketTypeId: ID;
  quantity: number;
  attendeeNames: string[];
}): TicketOrder {
  const ticketType = readStore("ticketTypes").find((t) => t.id === input.ticketTypeId);
  if (!ticketType) {
    throw new Error("ไม่พบประเภทบัตรนี้");
  }

  const remaining = ticketType.quota - ticketType.sold;
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("จำนวนบัตรต้องเป็นตัวเลขตั้งแต่ 1 ขึ้นไป");
  }
  if (input.quantity > remaining) {
    throw new Error(`บัตรเหลือเพียง ${remaining} ใบ`);
  }

  const attendeeNames = input.attendeeNames.map((name) => name.trim());
  if (attendeeNames.length !== input.quantity || attendeeNames.some((name) => name === "")) {
    throw new Error("กรุณากรอกชื่อผู้เข้าร่วมงานให้ครบทุกใบ");
  }

  const order: TicketOrder = {
    id: generateId("to"),
    customerId: input.customerId,
    eventId: ticketType.eventId,
    ticketTypeId: ticketType.id,
    quantity: input.quantity,
    unitPrice: ticketType.price,
    total: ticketType.price * input.quantity,
    attendeeNames,
    paymentMethod: "qr",
    paymentStatus: "pending",
    createdAt: nowISO(),
  };
  updateStore("ticketOrders", (orders) => [...orders, order]);
  return order;
}

/**
 * confirmTicketPayment — จำลองชำระสำเร็จ → เปลี่ยนเป็น paid, เพิ่ม sold, ออก Ticket ตามจำนวน
 *
 * เช็กโควตาอีกรอบตอนจ่าย เพราะระหว่างที่ลูกค้าเปิดหน้า QR ค้างไว้ คนอื่นอาจซื้อจนบัตรหมดแล้ว
 */
export function confirmTicketPayment(orderId: ID): Ticket[] {
  const order = readStore("ticketOrders").find((o) => o.id === orderId);
  if (!order) {
    throw new Error("ไม่พบคำสั่งซื้อนี้");
  }
  if (order.paymentStatus !== "pending") {
    throw new Error("คำสั่งซื้อนี้ไม่ได้อยู่ในสถานะรอชำระเงิน");
  }

  const ticketType = readStore("ticketTypes").find((t) => t.id === order.ticketTypeId);
  if (!ticketType || ticketType.quota - ticketType.sold < order.quantity) {
    throw new Error("บัตรไม่พอแล้ว กรุณาสั่งซื้อใหม่");
  }

  // บัตร 1 ใบต่อผู้เข้าร่วม 1 คน
  const tickets: Ticket[] = order.attendeeNames.map((attendeeName) => {
    const id = generateId("tk");
    return {
      id,
      orderId: order.id,
      eventId: order.eventId,
      ticketTypeId: order.ticketTypeId,
      customerId: order.customerId,
      attendeeName,
      qrCode: `TICKET:${id}`,
      checkedIn: false,
    };
  });

  updateStore("ticketOrders", (orders) =>
    orders.map((o) => (o.id === order.id ? { ...o, paymentStatus: "paid", paidAt: nowISO() } : o)),
  );
  updateStore("ticketTypes", (types) =>
    types.map((t) => (t.id === ticketType.id ? { ...t, sold: t.sold + order.quantity } : t)),
  );
  updateStore("tickets", (current) => [...current, ...tickets]);

  return tickets;
}

export function listTicketsByCustomer(customerId: ID): Ticket[] {
  void customerId;
  return notImplemented("listTicketsByCustomer");
}

export function listOrdersByEvent(eventId: ID): TicketOrder[] {
  void eventId;
  return notImplemented("listOrdersByEvent");
}

/** สแกน QR บัตร → คืนผลว่าเช็กอินได้หรือไม่ */
export function checkIn(
  qrCode: string,
  eventId: ID,
): { ok: true; ticket: Ticket } | { ok: false; reason: string } {
  void qrCode;
  void eventId;
  return notImplemented("checkIn");
}
