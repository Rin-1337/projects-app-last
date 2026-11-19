"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

/** ฟอร์มเปลี่ยนรหัสผ่าน: กรอกรหัสเดิม + รหัสใหม่ 2 ครั้ง */
export function PasswordForm({ userId }: { userId: string }) {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // กันหน้าเว็บโหลดใหม่ตอนกด submit
    setSuccess("");

    // เช็กว่าพิมพ์รหัสใหม่ตรงกันทั้ง 2 ช่อง ก่อนส่งไปเปลี่ยนจริง
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ทั้ง 2 ช่องไม่ตรงกัน");
      return;
    }

    const result = changePassword(userId, currentPassword, newPassword);
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    // สำเร็จ: ล้างช่องทั้งหมด ไม่ให้รหัสค้างอยู่บนหน้าจอ
    setError("");
    setSuccess("เปลี่ยนรหัสผ่านแล้ว");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="rounded-3xl border border-base-300 p-7">
      <h2 className="mb-4 text-2xl font-normal tracking-[-0.02em]">เปลี่ยนรหัสผ่าน</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">รหัสผ่านเดิม</span>
          <input
            className="input w-full border-0 bg-base-200 px-5"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">รหัสผ่านใหม่ (อย่างน้อย 4 ตัว)</span>
          <input
            className="input w-full border-0 bg-base-200 px-5"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">ยืนยันรหัสผ่านใหม่</span>
          <input
            className="input w-full border-0 bg-base-200 px-5"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-error">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <button type="submit" className="btn bg-base-200 px-7 font-normal">เปลี่ยนรหัสผ่าน</button>
      </form>
    </div>
  );
}
