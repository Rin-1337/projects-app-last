import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { DemoDataInit } from "@/components/shared/DemoDataInit";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
});

// ปิดการตรวจ instant navigation ทั้งเว็บ (เฉพาะตอน dev)
// เพราะทุกหน้าต้องรอ localStorage ฝั่ง browser (RoleGuard / useStore) server เลยเรนเดอร์ล่วงหน้าไม่ได้
// instant = false ใส่ที่ layout ไม่พอ เพราะ Next ยังตรวจ page.tsx ทุกหน้าอยู่
export const instant = { unstable_disableValidation: true };

export const metadata: Metadata = {
  title: "Event Platform",
  description: "ระบบลงทะเบียนและขายบัตร (Prototype)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900">
        <DemoDataInit />
        {children}
      </body>
    </html>
  );
}
