"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IBM_Plex_Sans_Thai, Inter } from "next/font/google";
import { useState, type SubmitEvent } from "react";
import { useAuth } from "@/lib/auth";

// ฟอนต์เดียวกับฝั่งลูกค้า: Inter (อังกฤษ) + IBM Plex Sans Thai (ไทย)
const inter = Inter({ subsets: ["latin"], display: "swap" });
const plexThai = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], display: "swap" });
const FONT_FAMILY = `${inter.style.fontFamily}, ${plexThai.style.fontFamily}, system-ui, sans-serif`;

// ช่องกรอกทรงแคปซูลสีเทา + ป้ายชื่อช่อง
// ตอนกดพิมพ์: พื้นเปลี่ยนเป็นขาว + กรอบสีเดียวกับปุ่มหลักของหน้านี้
// (ใส่ ! เพราะ daisyUI มีสไตล์ตอน focus ของตัวเองที่จะทับค่านี้)
const FIELD_INPUT =
  "input h-11 w-full border-0 bg-base-200 px-4.5 text-[15px] transition-colors focus:bg-base-100! focus:outline-offset-0! focus:outline-[#3F6B12]!";
const FIELD_LABEL = "text-xs text-base-content/60";

// สิ่งที่ได้หลังสมัคร (แสดงในบล็อกสี)
const BENEFITS = ["ซื้อบัตรออนไลน์ ได้ QR ทันที", "เติม Token จ่ายร้านค้าในงาน", "สั่งเสื้อและของที่ระลึก"];

// ผู้รับผิดชอบ: ทิวากร
export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // 1. อ่านค่าที่กรอกในฟอร์ม
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    // 2. เช็กว่ากรอกรหัสผ่านตรงกันทั้งสองช่อง
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    // 3. สมัครสมาชิก ถ้าไม่สำเร็จให้แสดงเหตุผล เช่น อีเมลซ้ำ
    const result = register({ name, email, phone, password });
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    // 4. ล้างฟอร์มแล้วกลับไปหน้าแรก
    //    ต้องล้างเอง เพราะ Next.js จำหน้าเก่าไว้ ถ้ากลับมารหัสผ่านจะยังค้างในช่อง
    event.currentTarget.reset();
    router.replace("/");
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
          className="flex flex-col justify-between gap-8 rounded-[20px] p-6 sm:p-10 lg:order-last"
          style={{ backgroundColor: "#C8F169", color: "#14301A" }}
        >
          <Link href="/" className="text-[17px] font-semibold tracking-[-0.03em]">
            eventhub
          </Link>
          <div className="flex flex-col gap-6">
            <h2 className="text-[28px] leading-[1.05] font-normal tracking-[-0.03em] lg:text-[44px]">
              สมัครครั้งเดียว
              <br />
              ไปได้ทุกงาน.
            </h2>
            <ul className="text-sm max-lg:hidden">
              {BENEFITS.map((text, index) => (
                <li key={text} className="flex justify-between gap-4 border-t py-3" style={{ borderColor: "rgba(20,48,26,.2)" }}>
                  <span>{text}</span>
                  <span className="shrink-0 opacity-75">{"0" + (index + 1)}</span>
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
              <Link href="/login" className="flex h-9 flex-1 items-center justify-center rounded-full text-sm text-base-content/60 hover:text-base-content">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" aria-current="page" className="flex h-9 flex-1 items-center justify-center rounded-full text-sm bg-neutral text-neutral-content">
                สมัครสมาชิก
              </Link>
            </nav>

            <h1 className="text-[28px] leading-tight font-medium tracking-[-0.03em] sm:text-[32px]">สร้างบัญชี.</h1>
            <p className="mt-2 mb-6 text-sm text-base-content/60">บัญชีลูกค้าสำหรับซื้อบัตรและเข้าร่วมงาน</p>

            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>ชื่อ-นามสกุล</span>
                <input className={FIELD_INPUT} name="name" autoComplete="name" maxLength={100} placeholder="ชื่อ นามสกุล" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>อีเมล</span>
                <input className={FIELD_INPUT} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>เบอร์โทรศัพท์ (ไม่บังคับ)</span>
                <input className={FIELD_INPUT} name="phone" type="tel" autoComplete="tel" maxLength={20} placeholder="08x-xxx-xxxx" />
              </label>
              <label className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>รหัสผ่าน (อย่างน้อย 4 ตัวอักษร)</span>
                <input className={FIELD_INPUT} name="password" type="password" autoComplete="new-password" minLength={4} required />
              </label>
              <label className="flex flex-col gap-1">
                <span className={FIELD_LABEL}>ยืนยันรหัสผ่าน</span>
                <input className={FIELD_INPUT} name="confirmPassword" type="password" autoComplete="new-password" required />
              </label>

              {error && (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              )}

              {/* สีเขียวเข้ม = สีเดียวกับบล็อกสีของหน้านี้ */}
              <button type="submit" className="btn btn-block mt-2 h-12 border-0 bg-[#3F6B12] text-[15px] font-normal text-white hover:bg-[#345A0E]">
                สมัครสมาชิก
              </button>
            </form>

            <p className="mt-4 text-sm text-base-content/60">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="font-medium text-base-content underline underline-offset-4">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
