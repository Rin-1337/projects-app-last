"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button, Card, Input } from "@/components/ui";
import { ROLE_HOME, useAuth } from "@/lib/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, resetDemoData } from "@/lib/seed";

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

  /** ลองเข้าสู่ระบบ ถ้าสำเร็จจะไปหน้าตาม Role และคืนค่า true */
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
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <Card>
        <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-slate-600">
          กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="อีเมล"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Input
            label="รหัสผ่าน"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full">
            เข้าสู่ระบบ
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-medium text-blue-700 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-slate-900">บัญชีทดลอง</h2>
        <p className="mt-1 text-sm text-slate-600">
          กดเพื่อเข้าสู่ระบบได้ทันที (รหัสผ่าน {DEMO_PASSWORD})
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {demoAccounts.map((account) => (
            <Button
              key={account.email}
              variant="secondary"
              onClick={() => tryLogin(account.email, DEMO_PASSWORD)}
            >
              {account.label}
            </Button>
          ))}
        </div>

        <Button variant="ghost" className="mt-2 w-full" onClick={handleResetDemoData}>
          รีเซ็ตข้อมูลทดลอง
        </Button>

        {message && (
          <p className="mt-2 text-center text-sm text-green-700" role="status">
            {message}
          </p>
        )}
      </Card>
    </main>
  );
}
