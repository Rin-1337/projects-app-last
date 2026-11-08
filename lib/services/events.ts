/**
 * lib/services/events.ts — Event และประเภทบัตร
 * เจ้าของ: วิริญา (Organizer – Event & Ticket)
 * ข้อมูลที่ดูแล: events, ticketTypes
 *
 * คนอื่นเรียกใช้ฟังก์ชันในไฟล์นี้ ห้ามเขียน events / ticketTypes เอง
 */
import type { EventItem, ID, TicketType } from "../types";
import { notImplemented } from "./_todo";
import { generateId, nowISO, readStore, updateStore } from "../storage";

/** Event ที่เปิดขาย (หน้าแรก / Customer) */
export function listPublishedEvents(): EventItem[] {
    return readStore("events").filter((event) => event.status === "published");
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

  const isEdit = readStore("events").some((e) => e.id === event.id);

  if (isEdit) {
    updateStore("events", (current) =>
      current.map((e) => (e.id === event.id ? { ...e, ...event } : e)),
    );
    return event;
  }

  const newEvent: EventItem = {
    ...event,
    id: event.id || generateId("ev"),
    createdAt: event.createdAt || nowISO(),
  };
  updateStore("events", (current) => [...current, newEvent]);
  return newEvent;
}

export function listTicketTypes(eventId: ID): TicketType[] {
    return readStore("ticketTypes").filter((type) => type.eventId === eventId);
}

export function saveTicketType(ticketType: TicketType): TicketType {
  void ticketType;
  return notImplemented("saveTicketType");
}
