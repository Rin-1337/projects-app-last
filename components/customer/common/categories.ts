import type { EventCategory } from "@/lib/types";

/**
 * หมวดหมู่งาน — ชื่อภาษาไทยสำหรับปุ่มกรองในหน้ารายการ Event และช่องเลือกในฟอร์มสร้างงานของ Organizer
 * และคำภาษาอังกฤษสำหรับหัวข้อตัวใหญ่ในหน้าแรก (เช่น "Music.")
 * ลำดับใน CATEGORY_ORDER = ลำดับปุ่ม
 */
export const CATEGORY_ORDER: EventCategory[] = ["music", "party", "food", "sport", "tech", "workshop"];

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  music: "ดนตรี",
  party: "ปาร์ตี้",
  food: "อาหาร",
  sport: "กีฬา",
  tech: "เทคโนโลยี",
  workshop: "เวิร์กช็อป",
};

const CATEGORY_WORD: Record<EventCategory, string> = {
  music: "Music",
  party: "Party",
  food: "Food",
  sport: "Sport",
  tech: "Tech",
  workshop: "Workshop",
};

/** คำสำหรับหัวข้อใหญ่ของงาน */
export function getCategoryWord(category: EventCategory) {
  return CATEGORY_WORD[category];
}
