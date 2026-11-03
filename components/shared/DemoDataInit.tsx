"use client";

import { useEffect } from "react";
import { seedIfEmpty } from "@/lib/seed";

/** ใส่ข้อมูลทดลองตอนเปิดเว็บครั้งแรก (อยู่ใน app/layout.tsx) */
export function DemoDataInit() {
  useEffect(() => {
    seedIfEmpty();
  }, []);
  return null;
}
