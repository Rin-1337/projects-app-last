"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, Card, CardTitle, Input } from "@/components/ui";
import { getVendorByUser, sellToCustomer } from "@/lib/services/vendors";
import { findCustomerByCode } from "@/lib/services/users";

// ผู้รับผิดชอบ: นัฐวิ
export default function VendorReceivePage() {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [code, setCode] = useState(""); // Customer ID ที่ร้านพิมพ์ (จาก QR ลูกค้า)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  if (!user) {
    return <p className="text-slate-500">กำลังโหลด...</p>;
  }

  const vendor = getVendorByUser(user.id);
  if (!vendor) {
    return (
      <Card>
        <p className="text-slate-600">บัญชีนี้ยังไม่มีร้าน กรุณาติดต่อ Admin</p>
      </Card>
    );
  }

  const total = vendor.priceToken * quantity;

  function changeQuantity(diff: number) {
    setQuantity((q) => Math.max(1, q + diff));
  }
  // หาลูกค้าทันทีที่พิมพ์ → โชว์ชื่อให้ร้านเช็กก่อนกดยืนยัน
  // ช่องว่าง = ยังไม่หา (undefined) · c0001 ตัวเล็กก็เจอ
  const customer = code.trim() ? findCustomerByCode(code) : undefined;
  // กดยืนยัน > ให้ service ขาย + หัก Token
  function handleSell() {
    setError("");
    setSuccess("");

    // เช็กร้านไว้ด้านบนแล้ว แต่ TypeScript ไม่รู้ในฟังก์ชั่นนี้ เลยเช็กซ้ำ
    if (!vendor) return;

    // ส่งแค่ ร้าน + รหัสลูกค้า + จำนวน - ไม่ส่งราคา (ราคาดึงจากระบบ)
    const result = sellToCustomer({
      vendorId: vendor.id,
      customerCode: code.trim().toUpperCase(),
      quantity,
    });

    // ไม่ผ่าน -> โชว์เหตุผลจาก service เช่น "Token ไม่พอ (คงเหลือ 380)"
    if (!result.ok) {
      setError(result.reason);
      return;
    }

    // ผ่าน -> ข้อความเขียว แล้วล้างช่อง รอลูกค้าคนต่อไป
    setSuccess(`ขายให้ ${result.customerName} สำเร็จ · รับ ${result.total} Token`);
    setCode("");
    setQuantity(1);
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      {/* การ์ดร้าน */}
      <Card>
        <CardTitle>{vendor.shopName}</CardTitle>
        <p className="text-slate-600">
          {vendor.productName} · {vendor.priceToken} Token / ชิ้น
        </p>
        {/* ร้านถูก Admin ปิด > ข้อความแดง */}
        {!vendor.active && (
          <p className="mt-2 text-sm text-red-600">
            ร้านถูกปิดชั่วคราว ขายไม่ได้
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>ขายสินค้า</CardTitle>
        <div className="flex items-center gap-3">
          {/* type="button" = ไม่ส่งฟอร์ม ต้องมี () => ไม่งั้นทำงานตอนวาดหน้า */}

          {/* ปุ่มลด */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => changeQuantity(-1)}
          >
            -
          </Button>

          {/* จำนวน */}
          <span className="w-10 text-center text-xl font-semibold">{quantity}</span>

          {/* ปุ่มเพิ่ม */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => changeQuantity(1)}
          >
            +
          </Button>
          <span className="ml-auto text-lg">
            รวม <b>{total}</b> Token
          </span>
        </div>
        {/* ช่อง Customer ID */}
        <Input
          label="Customer ID (จาก QR ลูกค้า)"
          placeholder="เช่น C0001"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {/* พิมพ์แล้วค่อยโชว์ : เจอ -> ชื่อ · ไม่เจอ -> ไม่พบ */}
        {code.trim() && (
          <p className="mt-2 text-sm">
            {customer ? (
              <span className="text-slate-700">ลูกค้า: {customer.name}</span>
            ) : (
              <span className="text-slate-400">ไม่พบลูกค้ารหัสนี้</span>
            )}
          </p>
        )}
        <Button
              className="mt-4 w-full"
              onClick={handleSell}
              disabled={!customer || !vendor.active}
            >
              ยืนยัน หัก {total} Token
            </Button>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
      </Card>
    </div>
  );
}
