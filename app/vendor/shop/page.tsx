"use client";

import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Badge, Card, CardTitle } from "@/components/ui";

// ผู้รับผิดชอบ: นัฐวิ (รับจากสุรัมภา)
export default function VendorShopPage() {
  const { user } = useAuth();
  // ใช้ useStore > ถ้า Admin แก้ราคา/ปิดร้าน หน้านี้เปลี่ยนตามทันที
  const vendors = useStore("vendors");
  const events = useStore("events");
  
  if (!user) return <p className="text-slate-500">กำลังโหลด...</p>;
  // หาร้านของบัญชี (เทียบ userId)
  const vendor = vendors.find((v) => v.userId === user.id);
  if (!vendor) return (<Card><p className="text-slate-600">บัญชีนี้ยังไม่มีร้าน กรุณาติดต่อ Admin</p></Card>);
  // งานที่ร้านนี้อยู่
  const event = events.find((e) => e.id === vendor.eventId);

  // ข้อมูลที่จะโชว์ เป็นคู่ [หัวข้อ, ค่า]
  const rows: [string, string][] = [
    ["งาน", event?.title ?? "-"],
    ["สินค้า", vendor.productName],
    ["ราคาต่อชิ้น", `${vendor.priceToken.toLocaleString()} Token`],
    ["เลขบูท", vendor.boothNo || "-"],
    ["รายละเอียด", vendor.description || "-"],
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{vendor.shopName}</CardTitle>
          {/* สถานะร้าน: เขียว = เปิด / แดง = ปิด */}
          <Badge tone={vendor.active ? "green" : "red"}>{vendor.active ? "เปิดขาย" : "ปิดชั่วคราว"}</Badge>
        </div>
        <dl className="mt-4 divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2 text-sm">
              <dt className="text-slate-600">{label}</dt>
              <dd className="text-right font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {/* ถ้าร้านปิด > เตือนเพิ่ม */}
      {!vendor.active && (<Card><p className="text-sm text-red-600">ร้านถูกปิดชั่วคราว ขายสินค้าไม่ได้ กรุณาติดต่อ Admin</p></Card>)}
      <p className="text-sm text-slate-500">ข้อมูลร้านและราคา Admin เป็นคนกำหนด หากต้องการแก้ไข กรุณาติดต่อ Admin</p>
    </div>
  );
}
