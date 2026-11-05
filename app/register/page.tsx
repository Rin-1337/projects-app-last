"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";

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

    // 4. ล้างฟอร์มแล้วไปหน้าแรกของลูกค้า
    //    ต้องล้างเอง เพราะ Next.js จำหน้าเก่าไว้ ถ้ากลับมารหัสผ่านจะยังค้างในช่อง
    event.currentTarget.reset();
    router.replace("/customer");
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900">สมัครสมาชิก</h1>
        <p className="mt-2 text-sm text-slate-600">
          สร้างบัญชีลูกค้าเพื่อเข้าร่วมงานและซื้อบัตร
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="ชื่อ-นามสกุล"
            name="name"
            autoComplete="name"
            maxLength={100}
            required
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
            required
          />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full">
            สมัครสมาชิก
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
