"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, CardTitle, Input } from "@/components/ui";
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
    <Card>
      <CardTitle>ข้อมูลส่วนตัว</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="อีเมล (ใช้ล็อกอิน แก้ไม่ได้)" value={user.email} disabled />
        <Input label="ชื่อ-นามสกุล" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="เบอร์โทร"
          inputMode="numeric"
          placeholder="0812345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <Button type="submit">บันทึก</Button>
      </form>
    </Card>
  );
}
