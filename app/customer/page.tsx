import { redirect } from "next/navigation";

// /customer ไม่มีหน้าของตัวเอง → พาไปหน้ารายการ Event แทน (เดิมเข้าแล้วเจอ 404)
export default function CustomerIndexPage() {
  redirect("/customer/events");
}
