import type { EventItem } from "@/lib/types";

/**
 * เลือกเฉพาะงานที่เปิดขาย แล้วเรียงจากงานที่จะถึงก่อน
 * ใช้ร่วมกันระหว่างหน้าแรก (app/page.tsx) และหน้ารายการ Event (app/customer/events/page.tsx)
 */
export function getPublishedEvents(events: EventItem[]) {
  const publishedEvents = events.filter((event) => event.status === "published");

  return publishedEvents.sort((a, b) => {
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });
}
