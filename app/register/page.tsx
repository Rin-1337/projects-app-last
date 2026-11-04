"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button, Card, Input } from "@/components/ui";
import { registerCustomer } from "@/lib/services/users";
import { writeStore } from "@/lib/storage";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsSubmitting(true);
    const result = registerCustomer({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password,
      phone: String(formData.get("phone") ?? ""),
    });

    if (!result.ok) {
      setError(result.reason);
      setIsSubmitting(false);
      return;
    }

    writeStore("session", { userId: result.user.id, role: result.user.role });
    router.replace("/customer");
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900">สมัครสมาชิก</h1>
        <p className="mt-2 text-sm text-slate-600">
          สร้างบัญชีลูกค้าเพื่อเข้าร่วมกิจกรรมและซื้อบัตร
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="ชื่อ-นามสกุล"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
          />
          <Input
            label="อีเมล"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Input
            label="เบอร์โทรศัพท์ (ไม่บังคับ)"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
          />
          <Input
            label="รหัสผ่าน (อย่างน้อย 4 ตัวอักษร)"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={4}
            required
          />
          <Input
            label="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={4}
            required
          />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-medium text-blue-700 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </Card>
    </main>
  );
}
