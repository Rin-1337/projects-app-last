"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";

/** ฟอร์มแก้ชื่อและเบอร์โทร (อีเมลแสดงอย่างเดียว แก้ไม่ได้) */
export function ProfileForm({ user }: { user: User }) {
  const { updateProfile } = useAuth();

  // ค่าเริ่มต้นของช่องเบอร์โทร (บางคนสมัครโดยไม่ใส่เบอร์)
  let defaultPhone = "";
  if (user.phone) {
    defaultPhone = user.phone;
  }

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // กันหน้าเว็บโหลดใหม่ตอนกด submit

    const result = updateProfile(user.id, name, phone);
    if (result.ok) {
      setError("");
      setSuccess("บันทึกข้อมูลแล้ว");
    } else {
      setSuccess("");
      setError(result.reason);
    }
  }

  return (
    <div className="rounded-3xl border border-base-300 p-7">
      <h2 className="mb-4 text-2xl font-normal tracking-[-0.02em]">ข้อมูลส่วนตัว</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">อีเมล (ใช้ล็อกอิน แก้ไม่ได้)</span>
          <input className="input w-full border-0 bg-base-200 px-5" value={user.email} disabled />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">ชื่อ-นามสกุล</span>
          <input className="input w-full border-0 bg-base-200 px-5" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">เบอร์โทร</span>
          <input
            className="input w-full border-0 bg-base-200 px-5"
            inputMode="numeric"
            placeholder="0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-error">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <button type="submit" className="btn btn-neutral px-7 font-normal">บันทึก</button>
      </form>
    </div>
  );
}
