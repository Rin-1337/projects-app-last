/**
 * lib/services/events.ts — Event และประเภทบัตร
 * เจ้าของ: วิริญา (Organizer – Event & Ticket)
 * ข้อมูลที่ดูแล: events, ticketTypes
 *
 * คนอื่นเรียกใช้ฟังก์ชันในไฟล์นี้ ห้ามเขียน events / ticketTypes เอง
 */
import type { EventItem, ID, TicketType } from "../types";
import { generateId, nowISO, readStore, updateStore } from "../storage";
import { logAction } from "./audit";

/**
 * งานนี้ "เลยวันจัด" แล้วหรือยัง (นับถึงสิ้นวันที่จัด 23:59 ตามเวลาเครื่อง)
 * ใช้ปิดการขายบัตร/ของที่ระลึกออนไลน์อัตโนมัติ โดยไม่ต้องรอ Organizer มากดปิดเอง
 */
export function isEventOver(event: Pick<EventItem, "startAt">): boolean {
  const endOfDay = new Date(event.startAt);
  endOfDay.setHours(23, 59, 59, 999);
  return new Date().getTime() > endOfDay.getTime();
}

/** Event ที่เปิดขาย (หน้าแรก / Customer) */
export function listPublishedEvents(): EventItem[] {
    return readStore("events").filter((event) => event.status === "published" && !isEventOver(event));
}

/** Event ที่ Organizer คนนี้รับผิดชอบ */
export function listEventsByOrganizer(organizerId: ID): EventItem[] {
    return readStore("events").filter((event) => event.organizerId === organizerId);
}

export function getEvent(eventId: ID): EventItem | undefined {
    return readStore("events").find((event) => event.id === eventId);
}

export function saveEvent(event: EventItem): EventItem {
    if (event.title.trim() === "") {
    throw new Error("กรุณากรอกชื่องาน");
  }

  const old = readStore("events").find((e) => e.id === event.id);
  const isEdit = old !== undefined;

  // ห้ามตั้งวันจัดงานย้อนหลัง
  // เช็กเฉพาะงานใหม่ หรือตอนเปลี่ยนวัน (งานที่จัดไปแล้วยังเปลี่ยนสถานะ/แก้รายละเอียดได้)
  // เทียบระดับนาที เพราะช่องในฟอร์มไม่มีวินาที
  const toMinute = (iso: string) => Math.floor(new Date(iso).getTime() / 60000);
  const dateChanged = !old || toMinute(old.startAt) !== toMinute(event.startAt);
  if (dateChanged && new Date(event.startAt).getTime() < Date.now()) {
    throw new Error("วันเวลาจัดงานต้องเป็นอนาคต ตั้งย้อนหลังไม่ได้");
  }

  if (isEdit) {
    updateStore("events", (current) =>
      current.map((e) => (e.id === event.id ? { ...e, ...event } : e)),
    );
    // Admin เปลี่ยน Organizer จะจด event.assign เองที่หน้า /admin/events จึงไม่จดซ้ำ
    if (readStore("session")?.role !== "admin") {
      logAction({ action: "event.update", targetId: event.id, detail: `แก้ไขงาน ${event.title}` });
    }
    return event;
  }

  const newEvent: EventItem = {
    ...event,
    id: event.id || generateId("ev"),
    createdAt: event.createdAt || nowISO(),
  };
  updateStore("events", (current) => [...current, newEvent]);
  logAction({ action: "event.create", targetId: newEvent.id, detail: `สร้างงาน ${newEvent.title}` });
  return newEvent;
}

export function listTicketTypes(eventId: ID): TicketType[] {
    return readStore("ticketTypes").filter((type) => type.eventId === eventId);
}

export function saveTicketType(ticketType: TicketType): TicketType {
  if (ticketType.name.trim() === "") {
    throw new Error("กรุณากรอกชื่อประเภทบัตร");
  }
  if (ticketType.price < 0) {
    throw new Error("ราคาต้องไม่ติดลบ");
  }
  if (ticketType.quota < 0) {
    throw new Error("โควตาต้องไม่ติดลบ");
  }

  const existing = readStore("ticketTypes").find((t) => t.id === ticketType.id);

  if (existing) {
    if (ticketType.quota < existing.sold) {
      throw new Error(`โควตาต้องไม่น้อยกว่าที่ขายไปแล้ว (${existing.sold} ใบ)`);
    }
    // sold ใช้ค่าจริงในระบบเสมอ ไม่ใช้ค่าจากฟอร์ม
    const updated: TicketType = { ...existing, ...ticketType, sold: existing.sold };
    updateStore("ticketTypes", (current) =>
      current.map((t) => (t.id === updated.id ? updated : t)),
    );
    logAction({ action: "event.ticket_type", targetId: updated.id, detail: `แก้ไขประเภทบัตร ${updated.name} (${updated.price} บาท, โควตา ${updated.quota})` });
    return updated;
  }

  const newTicketType: TicketType = {
    ...ticketType,
    id: ticketType.id || generateId("tt"),
    sold: 0, // บัตรใหม่ยังไม่มีใครซื้อ
  };
  updateStore("ticketTypes", (current) => [...current, newTicketType]);
  logAction({ action: "event.ticket_type", targetId: newTicketType.id, detail: `เพิ่มประเภทบัตร ${newTicketType.name} (${newTicketType.price} บาท, โควตา ${newTicketType.quota})` });
  return newTicketType;
}
