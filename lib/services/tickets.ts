/**
 * lib/services/tickets.ts — ซื้อบัตร ออก QR และ Check-in
 * เจ้าของ: วิริญา (Organizer – Event & Ticket)
 * ข้อมูลที่ดูแล: ticketOrders, tickets
 *
 * ทิวากร (Customer) เรียก createTicketOrder / confirmTicketPayment / listTicketsByCustomer
 */
import type { ID, Ticket, TicketOrder } from "../types";
import { notImplemented } from "./_todo";

/** สร้างคำสั่งซื้อสถานะ pending (ยังไม่ตัดโควตา) */
export function createTicketOrder(input: {
  customerId: ID;
  ticketTypeId: ID;
  quantity: number;
  attendeeNames: string[];
}): TicketOrder {
  void input;
  return notImplemented("createTicketOrder");
}

/** จำลองชำระสำเร็จ → เปลี่ยนเป็น paid, เพิ่ม sold, ออก Ticket ตามจำนวน */
export function confirmTicketPayment(orderId: ID): Ticket[] {
  void orderId;
  return notImplemented("confirmTicketPayment");
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
