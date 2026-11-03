"use client";

/**
 * lib/useStore.ts — React hook สำหรับอ่านข้อมูลจาก localStorage แบบอัปเดตอัตโนมัติ
 * ผู้ดูแล: นัฐวิ (PM)
 *
 * ตัวอย่าง:
 *   const events = useStore("events");
 *
 * เมื่อมีใครเรียก writeStore / updateStore ข้อมูลในทุกหน้าที่ใช้ hook นี้จะอัปเดตเอง
 * (รวมถึงเมื่อแก้จากแท็บอื่น)
 *
 * ⚠️ ห้ามแก้ค่าที่ได้จาก hook นี้ตรง ๆ (เช่น events.push(...))
 *    ให้แก้ผ่านฟังก์ชันใน lib/services/ เท่านั้น
 */

import { useSyncExternalStore } from "react";
import {
  getDefault,
  PREFIX,
  readStore,
  STORE_EVENT,
  type StorageSchema,
  type StoreKey,
} from "./storage";

// เก็บค่าล่าสุดไว้ เพื่อให้ React ได้ object เดิมถ้าข้อมูลไม่เปลี่ยน
const clientCache = new Map<StoreKey, { raw: string | null; value: unknown }>();
const serverCache = new Map<StoreKey, unknown>();

function subscribe(callback: () => void) {
  window.addEventListener(STORE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot<K extends StoreKey>(key: K): StorageSchema[K] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFIX + key);
  } catch {
    raw = null;
  }
  const cached = clientCache.get(key);
  if (cached && cached.raw === raw) return cached.value as StorageSchema[K];
  const value = readStore(key);
  clientCache.set(key, { raw, value });
  return value;
}

function getServerSnapshot<K extends StoreKey>(key: K): StorageSchema[K] {
  if (!serverCache.has(key)) serverCache.set(key, getDefault(key));
  return serverCache.get(key) as StorageSchema[K];
}

export function useStore<K extends StoreKey>(key: K): StorageSchema[K] {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(key),
    () => getServerSnapshot(key),
  );
}
