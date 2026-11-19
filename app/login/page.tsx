"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";
import { useState, type SubmitEvent } from "react";
import { getPublishedEvents } from "@/components/customer/common/getPublishedEvents";
import { useIsClient } from "@/components/customer/common/useIsClient";
import { ROLE_HOME, useAuth } from "@/lib/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, resetDemoData } from "@/lib/seed";
import { useStore } from "@/lib/useStore";

// ฟอนต์เดียวกับฝั่งลูกค้า: Inter (อังกฤษ) + IBM Plex Sans Thai (ไทย)
const inter = Inter({ subsets: ["latin"], display: "swap" });
const plexThai = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], display: "swap" });
const FONT_FAMILY = `${inter.style.fontFamily}, ${plexThai.style.fontFamily}, system-ui, sans-serif`;

// ช่องกรอกทรงแคปซูลสีเทา + ป้ายชื่อช่อง
// ตอนกดพิมพ์: พื้นเปลี่ยนเป็นขาว + กรอบสีเดียวกับปุ่มหลักของหน้านี้
// (ใส่ ! เพราะ daisyUI มีสไตล์ตอน focus ของตัวเองที่จะทับค่านี้)
const FIELD_INPUT =
  "input h-11 w-full border-0 bg-base-200 px-4.5 text-[15px] transition-colors focus:bg-base-100! focus:outline-offset-0! focus:outline-[#7C3AED]!";
const FIELD_LABEL = "text-xs text-base-content/60";

/** ปุ่มบัญชีทดลอง กดแล้วเข้าสู่ระบบได้เลย */
const demoAccounts = [
  { label: "ลูกค้า", email: DEMO_ACCOUNTS.customer },
  { label: "ผู้จัดงาน", email: DEMO_ACCOUNTS.organizer },
  { label: "ร้านค้า", email: DEMO_ACCOUNTS.vendor },
  { label: "ผู้ดูแลระบบ", email: DEMO_ACCOUNTS.admin },
];

// ผู้รับผิดชอบ: ทิวากร
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // งานที่ใกล้ถึง 3 งาน แสดงในบล็อกสี (ข้อมูลอยู่ใน localStorage จึงรอให้อยู่ฝั่ง browser ก่อน)
  const events = useStore("events");
  const isClient = useIsClient();
  const upcomingEvents = isClient ? getPublishedEvents(events).slice(0, 3) : [];

  /** ลองเข้าสู่ระบบ ถ้าสำเร็จจะไปหน้าตาม Role (ลูกค้าไปหน้าแรก) และคืนค่า true */
  function tryLogin(email: string, password: string) {
    setError("");
    setMessage("");

    const result = login(email, password);
    if (!result.ok) {
      setError(result.reason);
      return false;
    }

    router.replace(ROLE_HOME[result.user.role]);
    return true;
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    // 1. อ่านค่าที่กรอกในฟอร์ม
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    // 2. เข้าสู่ระบบ แล้วล้างฟอร์ม
    //    ต้องล้างเอง เพราะ Next.js จำหน้าเก่าไว้ ถ้ากลับมารหัสผ่านจะยังค้างในช่อง
    if (tryLogin(email, password)) {
      form.reset();
    }
  }

  function handleResetDemoData() {
    if (!window.confirm("ล้างข้อมูลทั้งหมดแล้วกลับไปใช้ข้อมูลทดลองเริ่มต้น?")) {
      return;
    }

    resetDemoData();
    setError("");
    setMessage("รีเซ็ตข้อมูลทดลองเรียบร้อยแล้ว");
  }

  return (
    // พื้นเทาเต็มจอ + การ์ดขาวกลางจอ แบ่งครึ่ง (จอเล็ก: บล็อกสีอยู่บน ฟอร์มอยู่ล่าง)
    <div
      data-theme="posh"
      className="flex flex-1 items-center justify-center bg-base-300 p-3 text-base-content sm:p-8"
      style={{ fontFamily: FONT_FAMILY }}
    >
      <div className="grid w-full max-w-280 gap-3 rounded-[28px] bg-base-100 p-3 shadow-sm lg:h-[min(800px,calc(100vh-64px))] lg:min-h-160 lg:grid-cols-2">
        {/* ───── บล็อกสี ───── */}
        <section
          className="flex flex-col justify-between gap-8 rounded-[20px] p-6 sm:p-10"
          style={{ backgroundColor: "#2B1745", color: "#F0ABFC" }}
        >
          <Link href="/" className="text-[17px] font-semibold tracking-[-0.03em]">
            eventhub
          </Link>
          <div className="flex flex-col gap-6">
            <h2 className="text-[28px] leading-[1.05] font-normal tracking-[-0.03em] lg:text-[44px]">
              งานดี ๆ
              <br />
              เริ่มที่นี่.
            </h2>
            <ul className="text-sm max-lg:hidden">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="flex justify-between gap-4 border-t py-3" style={{ borderColor: "rgba(240,171,252,.25)" }}>
                  <span>{event.title}</span>
                  <span className="shrink-0 opacity-75">{new Date(event.startAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" })}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───── ฟอร์ม (my-auto = อยู่กลางแนวตั้ง ถ้ายาวเกินการ์ดจะเลื่อนดูได้) ───── */}
        <section className="flex flex-col items-center px-3 py-8 sm:px-8 lg:overflow-y-auto lg:py-6">
          <div className="my-auto w-full max-w-96">
            {/* ปุ่มสลับ เข้าสู่ระบบ | สมัครสมาชิก */}
            <nav aria-label="เลือกหน้า" className="mb-6 flex gap-1 rounded-full bg-base-200 p-1">
              <Link href="/login" aria-current="page" className="flex h-9 flex-1 items-center justify-center rounded-full text-sm bg-neutral text-neutral-content">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="flex h-9 flex-1 items-center justify-center rounded-full text-sm text-base-content/60 hover:text-base-content">
                สมัครสมาชิก
              </Link>
            </nav>

            <h1 className="text-[28px] leading-tight font-medium tracking-[-0.03em] sm:text-[32px]">ยินดีต้อนรับกลับ.</h1>
            <p className="mt-2 mb-6 text-sm text-base-content/60">กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน</p>

            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>อีเมล</span>
                <input className={FIELD_INPUT} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>รหัสผ่าน</span>
                <input className={FIELD_INPUT} name="password" type="password" autoComplete="current-password" required />
              </label>

              {error && (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-block mt-2 h-12 text-[15px] font-normal">
                เข้าสู่ระบบ
              </button>
            </form>

            <p className="mt-4 text-sm text-base-content/60">
              ยังไม่มีบัญชี?{" "}
              <Link href="/register" className="font-medium text-base-content underline underline-offset-4">
                สมัครสมาชิก
              </Link>
            </p>

            {/* บัญชีทดลอง: กดแล้วเข้าสู่ระบบได้เลย */}
            <div className="mt-8 border-t border-base-300 pt-5">
              <p className="text-xs text-base-content/60">ทดลองใช้งานเป็น (รหัสผ่าน {DEMO_PASSWORD})</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className="btn btn-sm h-9 rounded-full border-base-300 bg-base-100 px-4 text-[13px] font-normal hover:border-[#7C3AED]! hover:bg-[#7C3AED]/5! hover:text-[#7C3AED]!"
                    onClick={() => tryLogin(account.email, DEMO_PASSWORD)}
                  >
                    {account.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="mt-3 text-xs text-base-content/60 underline underline-offset-4 hover:text-base-content"
                onClick={handleResetDemoData}
              >
                รีเซ็ตข้อมูลทดลอง
              </button>

              {message && (
                <p className="mt-2 text-sm text-success" role="status">
                  {message}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
