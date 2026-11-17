"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, CardTitle, Input } from "@/components/ui";

/**
 * ฟอร์มที่อยู่จัดส่ง
 * กรอกครบและถูกต้องแล้วจะรวมเป็นข้อความเดียว แล้วส่งให้หน้าแม่ผ่าน onSubmit
 * (createOnlineOrder() รับที่อยู่เป็นข้อความเดียว ชื่อ shippingAddress)
 */
export function AddressForm({
  defaultName,
  defaultPhone,
  submitError,
  onSubmit,
}: {
  defaultName: string;
  defaultPhone: string;
  /** error จากการสร้างคำสั่งซื้อ เช่น สินค้าเพิ่งหมด */
  submitError: string;
  onSubmit: (shippingAddress: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // กันหน้าเว็บโหลดใหม่ตอนกด submit

    // ───── ตรวจข้อมูลทีละช่อง ─────
    if (name.trim() === "" || phone.trim() === "" || address.trim() === "" || postalCode.trim() === "") {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    // เบอร์โทร: ตัวเลข 9-10 หลัก เช่น 0812345678
    if (!/^[0-9]{9,10}$/.test(phone.trim())) {
      setError("เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก");
      return;
    }
    // รหัสไปรษณีย์: ตัวเลข 5 หลัก
    if (!/^[0-9]{5}$/.test(postalCode.trim())) {
      setError("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");
      return;
    }

    setError("");

    // รวมเป็นข้อความเดียว ขึ้นบรรทัดใหม่แต่ละส่วน ผู้จัดงานจะอ่านง่ายตอนแพ็กของ
    const shippingAddress =
      name.trim() + "\n" + "โทร " + phone.trim() + "\n" + address.trim() + " " + postalCode.trim();
    onSubmit(shippingAddress);
  }

  // แสดง error ของฟอร์มก่อน ถ้าไม่มีค่อยแสดง error จากการสั่งซื้อ
  let errorToShow = error;
  if (errorToShow === "") {
    errorToShow = submitError;
  }

  return (
    <Card>
      <CardTitle>ที่อยู่จัดส่ง</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ชื่อ-นามสกุลผู้รับ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="เบอร์โทร"
          inputMode="numeric"
          placeholder="0812345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* ใช้ textarea เพราะที่อยู่ยาวหลายบรรทัด (Input ของ components/ui เป็นแค่บรรทัดเดียว) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm text-slate-600">
            ที่อยู่ (บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด)
          </label>
          <textarea
            id="address"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <Input
          label="รหัสไปรษณีย์"
          inputMode="numeric"
          maxLength={5}
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />

        {errorToShow && <p className="text-sm text-red-600">{errorToShow}</p>}

        <Button type="submit" size="lg" className="w-full">
          ยืนยันคำสั่งซื้อและชำระเงิน
        </Button>
      </form>
    </Card>
  );
}
