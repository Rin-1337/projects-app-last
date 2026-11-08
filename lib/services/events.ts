/**
 * lib/services/events.ts — Event และประเภทบัตร
 * เจ้าของ: วิริญา (Organizer – Event & Ticket)
 * ข้อมูลที่ดูแล: events, ticketTypes
 *
 * คนอื่นเรียกใช้ฟังก์ชันในไฟล์นี้ ห้ามเขียน events / ticketTypes เอง
 */
import type { EventItem, ID, TicketType } from "../types";
import { notImplemented } from "./_todo";
import { readStore } from "../storage";

/** Event ที่เปิดขาย (หน้าแรก / Customer) */
export function listPublishedEvents(): EventItem[] {
    return readStore("events").filter((event) => event.status === "published");
}

/** Event ที่ Organizer คนนี้รับผิดชอบ */
export function listEventsByOrganizer(organizerId: ID): EventItem[] {
  void organizerId;
  return notImplemented("listEventsByOrganizer");
}

export function getEvent(eventId: ID): EventItem | undefined {
  void eventId;
  return notImplemented("getEvent");
}

export function saveEvent(event: EventItem): EventItem {
  void event;
  return notImplemented("saveEvent");
}

export function listTicketTypes(eventId: ID): TicketType[] {
  void eventId;
  return notImplemented("listTicketTypes");
}

export function saveTicketType(ticketType: TicketType): TicketType {
  void ticketType;
  return notImplemented("saveTicketType");
}
