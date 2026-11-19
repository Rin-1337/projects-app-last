"use client";

import { useState, type FormEvent } from "react";

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
    <div className="rounded-3xl border border-base-300 p-7">
      <h2 className="mb-4 text-2xl font-normal tracking-[-0.02em]">ที่อยู่จัดส่ง</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">ชื่อ-นามสกุลผู้รับ</span>
          <input className="input w-full border-0 bg-base-200 px-5" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">เบอร์โทร</span>
          <input
            className="input w-full border-0 bg-base-200 px-5"
            inputMode="numeric"
            placeholder="0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        {/* ใช้ textarea เพราะที่อยู่ยาวหลายบรรทัด */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">ที่อยู่ (บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด)</span>
          <textarea
            className="textarea w-full rounded-3xl border-0 bg-base-200 px-5"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-base-content/70">รหัสไปรษณีย์</span>
          <input
            className="input w-full border-0 bg-base-200 px-5"
            inputMode="numeric"
            maxLength={5}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </label>

        {errorToShow && <p className="text-sm text-error">{errorToShow}</p>}

        <button type="submit" className="btn btn-primary btn-block h-13 text-base font-normal">
          ยืนยันคำสั่งซื้อและชำระเงิน
        </button>
      </form>
    </div>
  );
}
