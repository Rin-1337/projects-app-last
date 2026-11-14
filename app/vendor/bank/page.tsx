"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Badge, Button, Card, CardTitle, Input } from "@/components/ui";
import { getVendorByUser, saveBankAccount } from "@/lib/services/vendors";
import type { BankAccount } from "@/lib/types";

// ผู้รับผิดชอบ: นัฐวิ
export default function VendorBankPage() {
  const { user } = useAuth();
  // อ่านด้วย useStore > เพิ่ม/ตั้งบัญชีหลักแล้วหน้าอัปเดตเอง ไม่ต้องรีเฟรช
  const allAccounts = useStore("bankAccounts");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [asDefault, setAsDefault] = useState(false); // ติ๊ก "ตั้งเป็นบัญชีหลัก"
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

  // เอาเฉพาะบัญชีของร้านนี้ บัญชีหลักขึ้นก่อน
  const account = allAccounts
    .filter((a) => a.vendorId === vendor.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  function makeDefault(account: BankAccount) {
    saveBankAccount({ ...account, isDefault: true });
  }

  // กดบันทุก -> ส่งให้ saveBankAccount ตรวจ + บันทึก
  function handleAdd() {
    setError("");
    setSuccess("");
    if (!vendor) return; // เช็กไว้ด้านบนแล้ว แต่ TypeScript ไม่รู้ในฟังก์ชันนี้

    try {
      saveBankAccount({
        id: "", // id  ว่าง = บัญชีใหม่ (service สร้าง id ให้)
        vendorId: vendor.id,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        isDefault: asDefault, // บัญชีแรกของร้านจะเป็นหลักให้อัตโนมัติ
      });
    } catch (e) {
      // กรอกไม่ครบ > service throw "กรอกชื่อธนาคาร ชื่อบัญชี และเลขบัญชีให้ครบ"
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      return;
    }

    setSuccess(`เพิ่มบัญชี ${bankName.trim()} แล้ว`);
    // ล้างฟอร์ม พร้อมเพิ่มบัญชีถัดไป
    setBankName("");
    setAccountName("");
    setAccountNumber("");
    setAsDefault(false);
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">บัญชีธนาคาร</h1>
        <p className="text-sm text-slate-600">
          บัญชีที่ใช้รับเงินตอนถอน · มีบัญชีหลักได้ 1 บัญชี
        </p>
      </div>

      <Card>
        <CardTitle>บัญชีของร้าน</CardTitle>

        {/* ยังไม่มีบัญชี -> บอกว่าต้องทำอะไรต่อ */}
        {account.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            ยังไม่มีบัญชีธนาคาร เพิ่มบัญชีด้านล่างก่อน จึงจะขอถอนเงินได้
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {account.map((account) => (
              <li
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {account.bankName}{" "}
                    {account.isDefault && <Badge tone="blue">บัญชีหลัก</Badge>}
                  </p>
                  <p className="text-sm text-slate-600">
                    {account.accountNumber} · {account.accountName}
                  </p>
                </div>

                {/* บัญชีหลักอยู่แล้วไม่ต้องมีปุ่ม */}
                {!account.isDefault && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => makeDefault(account)}
                  >
                    ตั้งเป็นบัญชีหลัก
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>เพิ่มบัญชี</CardTitle>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            label="ธนาคาร"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="เช่น ธนาคารกสิกรไทย"
          />
          <Input
            label="ชื่อบัญชี"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="ตรงกับชื่อเจ้าของร้าน"
          />
          <Input
            label="เลขบัญชี"
            inputMode="numeric" // มือถือแป้นตัวเลข
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="123-4-56789-0"
          />
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={asDefault}
            onChange={(e) => setAsDefault(e.target.checked)}
            className="h-4 w-4"
          />
          ตั้งเป็นบัญชีหลัก
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-700">{success}</p>}

        <div className="mt-4">
          <Button onClick={handleAdd}>บันทึกบัญชี</Button>
        </div>
      </Card>
    </div>
  );
}


// { ...account, isDefault: true }: คัดลอกบัญชีเดิมแล้วเปลี่ยนแค่ช่อง isDefault ส่งให้ saveBankAccount ซึ่งเห็นว่ามี id อยู่แล้ว จะแก้บัญชีเดิม (ไม่สร้างใหม่) และปลดบัญชีอื่นของร้านไม่ให้เป็นหลักให้เอง
// accounts.length === 0 ? (...) : (...): ถ้ายังไม่มีบัญชี บอกว่าต้องเพิ่มก่อน ไม่ปล่อยให้เป็นหน้าว่าง
// key={account.id}: React ต้องมี key ที่ไม่ซ้ำทุกครั้งที่ .map วาดรายการ
// onClick={() => makeDefault(account)}: ต้องครอบด้วย () => ถ้าเขียน onClick={makeDefault(account)} ฟังก์ชันจะรันทันทีตอนวาดหน้า ไม่ได้รอกด