/**
 * lib/storage.ts — ตัวกลางอ่าน/เขียน localStorage
 * ผู้ดูแล: นัฐวิ (PM)
 *
 * กฎของทีม:
 * - ห้ามเรียก localStorage ตรง ๆ ในหน้าเว็บ ให้ใช้ readStore / writeStore
 * - ข้อมูลแต่ละชุดมีเจ้าของ (ดูคอมเมนต์ใน StorageSchema)
 *   คนอื่นให้เรียกฟังก์ชันใน lib/services/ ของเจ้าของ ไม่เขียนข้อมูลชุดนั้นเอง
 * - ใช้ได้เฉพาะใน Client Component ("use client") เท่านั้น
 */

import type {
  AuditLog,
  BankAccount,
  EventItem,
  MerchOrder,
  MerchProduct,
  Session,
  Ticket,
  TicketOrder,
  TicketType,
  TokenTransaction,
  User,
  Vendor,
  VendorProduct,
  Wallet,
  Withdrawal,
} from "./types";

export interface StorageSchema {
  // ทิวากร
  session: Session | null;
  // นัฐวิ
  users: User[];
  wallets: Wallet[];
  tokenTransactions: TokenTransaction[];
  auditLogs: AuditLog[];
  // วิริญา
  events: EventItem[];
  ticketTypes: TicketType[];
  ticketOrders: TicketOrder[];
  tickets: Ticket[];
  // อรอนงค์
  merchProducts: MerchProduct[];
  merchOrders: MerchOrder[];
  // สุรัมภา
  vendors: Vendor[];
  vendorProducts: VendorProduct[];
  bankAccounts: BankAccount[];
  withdrawals: Withdrawal[];
}

export type StoreKey = keyof StorageSchema;

/** ทุก key ใน localStorage ขึ้นต้นด้วย ep_ เช่น ep_users */
export const PREFIX = "ep_";

const DEFAULTS: StorageSchema = {
  session: null,
  users: [],
  wallets: [],
  tokenTransactions: [],
  auditLogs: [],
  events: [],
  ticketTypes: [],
  ticketOrders: [],
  tickets: [],
  merchProducts: [],
  merchOrders: [],
  vendors: [],
  vendorProducts: [],
  bankAccounts: [],
  withdrawals: [],
};

export const STORE_KEYS = Object.keys(DEFAULTS) as StoreKey[];

const isBrowser = () => typeof window !== "undefined";

/** ค่าเริ่มต้นของข้อมูลแต่ละชุด (ไม่อ่าน localStorage) */
export function getDefault<K extends StoreKey>(key: K): StorageSchema[K] {
  return structuredClone(DEFAULTS[key]);
}

/** อ่านข้อมูล 1 ชุด ถ้าไม่มีหรืออ่านไม่ได้จะคืนค่าเริ่มต้น */
export function readStore<K extends StoreKey>(key: K): StorageSchema[K] {
  if (!isBrowser()) return structuredClone(DEFAULTS[key]);
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return structuredClone(DEFAULTS[key]);
    return JSON.parse(raw) as StorageSchema[K];
  } catch {
    return structuredClone(DEFAULTS[key]);
  }
}

/** เขียนทับข้อมูล 1 ชุด แล้วแจ้งทุก component ที่ใช้ useStore ให้อัปเดต */
export function writeStore<K extends StoreKey>(
  key: K,
  value: StorageSchema[K],
): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: key }));
  } catch (err) {
    console.error(`[storage] เขียน ${key} ไม่สำเร็จ`, err);
  }
}

/** แก้ข้อมูลแบบอ่าน-แก้-เขียนในครั้งเดียว */
export function updateStore<K extends StoreKey>(
  key: K,
  updater: (current: StorageSchema[K]) => StorageSchema[K],
): StorageSchema[K] {
  const next = updater(readStore(key));
  writeStore(key, next);
  return next;
}

/** ลบข้อมูลทั้งหมดของแอป (ใช้กับปุ่ม "รีเซ็ตข้อมูลทดลอง") */
export function clearAllStores(): void {
  if (!isBrowser()) return;
  try {
    for (const key of STORE_KEYS) window.localStorage.removeItem(PREFIX + key);
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: "*" }));
  } catch (err) {
    console.error("[storage] ล้างข้อมูลไม่สำเร็จ", err);
  }
}

/** ชื่อ event ที่ยิงทุกครั้งที่ข้อมูลเปลี่ยน (ใช้ใน lib/useStore.ts) */
export const STORE_EVENT = "ep-store-change";

/** สร้าง id แบบมี prefix เช่น generateId("tk") → "tk_m1x2y3_ab12" */
export function generateId(prefix: string): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${time}_${rand}`;
}

/** เวลาปัจจุบันเป็น ISO string */
export function nowISO(): string {
  return new Date().toISOString();
}
