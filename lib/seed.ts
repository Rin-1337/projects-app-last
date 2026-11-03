/**
 * lib/seed.ts — ข้อมูลทดลองสำหรับ Prototype
 * ผู้ดูแล: นัฐวิ (PM)
 *
 * บัญชีทดลอง (รหัสผ่าน 1234 ทุกบัญชี)
 *   customer   somying@test.com    (Customer ID: C0001)
 *   organizer  organizer@test.com
 *   vendor     vendor@test.com
 *   admin      admin@test.com
 *
 * ใครต้องการข้อมูลทดลองเพิ่ม ให้เพิ่มในไฟล์นี้แล้วเปิด PR
 * id ในไฟล์นี้ตั้งตายตัว (เช่น "u_customer") เพื่อให้อ้างอิงข้ามกันได้ง่าย
 */

import { clearAllStores, readStore, writeStore } from "./storage";
import type { StorageSchema } from "./storage";

const T = "2026-11-01T09:00:00+07:00";

export const DEMO_PASSWORD = "1234";

export const DEMO_ACCOUNTS = {
  customer: "somying@test.com",
  organizer: "organizer@test.com",
  vendor: "vendor@test.com",
  admin: "admin@test.com",
} as const;

function buildSeed(): Omit<StorageSchema, "session"> {
  return {
    users: [
      {
        id: "u_customer",
        role: "customer",
        name: "สมหญิง ตัวอย่าง",
        email: DEMO_ACCOUNTS.customer,
        password: DEMO_PASSWORD,
        phone: "0812345678",
        customerCode: "C0001",
        status: "active",
        createdAt: T,
      },
      {
        id: "u_organizer",
        role: "organizer",
        name: "ผู้จัดงาน ตัวอย่าง",
        email: DEMO_ACCOUNTS.organizer,
        password: DEMO_PASSWORD,
        status: "active",
        createdAt: T,
      },
      {
        id: "u_vendor",
        role: "vendor",
        name: "ร้านค้า ตัวอย่าง",
        email: DEMO_ACCOUNTS.vendor,
        password: DEMO_PASSWORD,
        status: "active",
        createdAt: T,
      },
      {
        id: "u_admin",
        role: "admin",
        name: "ผู้ดูแลระบบ",
        email: DEMO_ACCOUNTS.admin,
        password: DEMO_PASSWORD,
        status: "active",
        createdAt: T,
      },
    ],

    wallets: [
      { userId: "u_customer", balance: 500 },
      { userId: "u_vendor", balance: 0 },
    ],

    tokenTransactions: [
      {
        id: "tx_seed_1",
        type: "topup",
        amount: 500,
        fromUserId: null,
        toUserId: "u_customer",
        channel: "online_qr",
        createdAt: T,
      },
    ],

    auditLogs: [],

    events: [
      {
        id: "ev_reunion",
        title: "งานเลี้ยงรุ่นศิษย์เก่า 2026",
        description: "งานเลี้ยงสังสรรค์ศิษย์เก่าประจำปี พร้อมดนตรีสดและบูทอาหาร",
        startAt: "2026-12-12T17:00:00+07:00",
        location: "หอประชุมใหญ่",
        organizerId: "u_organizer",
        status: "published",
        createdAt: T,
      },
      {
        id: "ev_nightmarket",
        title: "Night Market Fest",
        description: "ตลาดนัดกลางคืน อาหาร ดนตรี และของแฮนด์เมด",
        startAt: "2026-12-20T17:00:00+07:00",
        location: "ตลาดนัดหน้าโรงงาน",
        organizerId: null,
        status: "published",
        createdAt: T,
      },
    ],

    ticketTypes: [
      { id: "tt_normal", eventId: "ev_reunion", name: "ปกติ", price: 350, quota: 100, sold: 0 },
      { id: "tt_vip", eventId: "ev_reunion", name: "VIP", price: 800, quota: 20, sold: 0 },
      { id: "tt_general", eventId: "ev_nightmarket", name: "ทั่วไป", price: 150, quota: 500, sold: 0 },
    ],

    ticketOrders: [],
    tickets: [],

    merchProducts: [
      {
        id: "mp_shirt",
        eventId: "ev_reunion",
        name: "เสื้องานเลี้ยงรุ่น 2026",
        description: "เสื้อยืดคอกลม ผ้าคอตตอน 100%",
        price: 290,
        variants: [
          { size: "S", stock: 20 },
          { size: "M", stock: 30 },
          { size: "L", stock: 30 },
          { size: "XL", stock: 20 },
        ],
        active: true,
        createdAt: T,
      },
      {
        id: "mp_keychain",
        eventId: "ev_reunion",
        name: "พวงกุญแจที่ระลึก",
        price: 89,
        variants: [{ size: "FREE", stock: 100 }],
        active: true,
        createdAt: T,
      },
    ],

    merchOrders: [],

    vendors: [
      {
        id: "vd_coffee",
        userId: "u_vendor",
        eventId: "ev_reunion",
        shopName: "กาแฟศิษย์เก่า",
        description: "กาแฟสดและเครื่องดื่มเย็น",
        boothNo: "A01",
        approvalStatus: "approved",
        qrCode: "VENDOR:vd_coffee",
        createdAt: T,
      },
    ],

    vendorProducts: [
      {
        id: "vp_latte",
        vendorId: "vd_coffee",
        eventId: "ev_reunion",
        name: "ลาเต้เย็น",
        priceToken: 60,
        status: "approved",
        reviewedBy: "u_organizer",
        reviewedAt: T,
        createdAt: T,
      },
      {
        id: "vp_cocoa",
        vendorId: "vd_coffee",
        eventId: "ev_reunion",
        name: "โกโก้ปั่น",
        priceToken: 55,
        status: "pending",
        createdAt: T,
      },
    ],

    bankAccounts: [
      {
        id: "ba_coffee",
        vendorId: "vd_coffee",
        bankName: "ธนาคารกสิกรไทย",
        accountName: "ร้านกาแฟศิษย์เก่า",
        accountNumber: "123-4-56789-0",
        isDefault: true,
      },
    ],

    withdrawals: [],
  };
}

/** ใส่ข้อมูลทดลองถ้ายังไม่มีผู้ใช้ในระบบ (เรียกครั้งเดียวตอนเปิดเว็บ) */
export function seedIfEmpty(): void {
  if (readStore("users").length > 0) return;
  const seed = buildSeed();
  for (const key of Object.keys(seed) as (keyof typeof seed)[]) {
    writeStore(key, seed[key]);
  }
}

/** ล้างข้อมูลทั้งหมดแล้วใส่ข้อมูลทดลองใหม่ (ปุ่ม "รีเซ็ตข้อมูลทดลอง") */
export function resetDemoData(): void {
  clearAllStores();
  seedIfEmpty();
}
