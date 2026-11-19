/**
 * ค่าที่ใช้ซ้ำหลายหน้าในฝั่งลูกค้า — ผู้รับผิดชอบ: ทิวากร
 * ตัวเลขขนาด (เช่น 120px, -0.055em) เอามาจากไฟล์ design "EventHub Customer — สไตล์ Posh"
 * ถ้าจะเปลี่ยนขนาดหัวข้อ แก้ที่นี่ที่เดียว ทุกหน้าจะเปลี่ยนตาม
 */

/** หัวข้อใหญ่ของหน้า: มือถือ 56px → แท็บเล็ต 88px → จอใหญ่ 120px ตัวชิดกัน */
export const PAGE_TITLE = "text-[56px] leading-none font-normal tracking-[-0.055em] sm:text-[88px] lg:text-[120px]";

/** หัวข้อใหญ่แบบเล็กลงนิด (จอใหญ่ 112px) ใช้กับหน้าที่ชื่อยาว เช่น "ประวัติรายการ." */
export const PAGE_TITLE_SM = "text-[56px] leading-none font-normal tracking-[-0.055em] sm:text-[88px] lg:text-[112px]";

/** หน้าที่เป็นพื้นดำ (theme posh-dark) — อยากให้หน้าไหนเป็นพื้นดำ เพิ่ม path ที่นี่ */
const DARK_PAGES = ["/customer/events/", "/customer/tickets", "/customer/wallet"];

export function isDarkPage(pathname: string) {
  return DARK_PAGES.some((path) => pathname.startsWith(path));
}
