"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, CardTitle, Input } from "@/components/ui";
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
    <Card>
      <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="รหัสผ่านเดิม"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          label="รหัสผ่านใหม่ (อย่างน้อย 4 ตัว)"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="ยืนยันรหัสผ่านใหม่"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <Button type="submit">เปลี่ยนรหัสผ่าน</Button>
      </form>
    </Card>
  );
}
