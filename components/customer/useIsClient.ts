"use client";

import { useSyncExternalStore } from "react";

/**
 * useIsClient — บอกว่าตอนนี้หน้าเว็บทำงานอยู่บน browser แล้วหรือยัง
 *
 * ทำไมต้องมี
 *   Next.js สร้าง HTML บน server ก่อน แต่ server อ่าน localStorage ไม่ได้
 *   จึงยังไม่รู้ว่าใครล็อกอินอยู่ และยังไม่มีข้อมูลงาน
 *
 * วิธีใช้
 *   const isClient = useIsClient();
 *   false = อยู่บน server ให้แสดงหน้าโหลด
 *   true  = อยู่บน browser แล้ว แสดงข้อมูลจริงได้
 *
 * ไม่ต้องเข้าใจไส้ในก็ใช้ได้ — useSyncExternalStore รับ 3 ค่า:
 * ฟังก์ชันติดตามการเปลี่ยนแปลง (ค่านี้ไม่เปลี่ยน จึงไม่ต้องติดตาม), ค่าบน browser, ค่าบน server
 * ที่ไม่ใช้ useState + useEffect เพราะ ESLint ของโปรเจคห้ามเรียก setState ใน useEffect แบบนั้น
 */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
