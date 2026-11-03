import Link from "next/link";
import { Card } from "@/components/ui";

// หน้าแรก — ผู้รับผิดชอบ: ทิวากร
// TODO: แบนเนอร์ Event + รายการบัตร + การ์ด เติม Token / QR Ticket / จ่ายร้านค้า (ตามสไลด์)
//       ตอนนี้เป็นหน้าลิงก์ชั่วคราวสำหรับทดสอบแต่ละ Role

const sections = [
  { href: "/customer", label: "Customer", owner: "ปอ" },
  { href: "/organizer", label: "Organizer – Event & Ticket", owner: "เตย" },
  { href: "/organizer/merch", label: "Organizer – Merchandise", owner: "ผักบุ้ง" },
  { href: "/vendor", label: "Vendor", owner: "นุ่น" },
  { href: "/admin", label: "Admin", owner: "เซน" },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Event Platform</h1>
      <p className="mt-2 text-slate-600">
        ระบบลงทะเบียนและขายบัตร — Prototype (ข้อมูลเก็บใน localStorage)
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          เข้าสู่ระบบ
        </Link>
        <Link href="/register" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">
          สมัครสมาชิก
        </Link>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:border-blue-400">
              <p className="font-semibold text-slate-900">{s.label}</p>
              <p className="text-sm text-slate-500">ผู้รับผิดชอบ: {s.owner}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
