"use client";

import { useState } from "react";
import { formatEventDate } from "@/components/customer/formatEventDate";
import { QRDisplay } from "@/components/shared/QRDisplay";
import { Button, Card, CardTitle, Input, Modal } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { topupOnline } from "@/lib/services/wallet";
import type { TokenTransaction } from "@/lib/types";
import { useStore } from "@/lib/useStore";

// หน้า Token Wallet — ผู้รับผิดชอบ: ทิวากร
//
// หน้านี้มี 4 ส่วน
//   1. ยอด Token คงเหลือ
//   2. QR ของลูกค้า (Customer ID เช่น C0001) ให้ร้านค้าสแกนเพื่อหัก Token
//   3. เติม Token ผ่าน QR (จำลอง ไม่ได้ต่อธนาคารจริง)
//   4. ประวัติการเติมและใช้ Token
//
// ทำไมใช้ useStore แทน getBalance() / listTransactions()
//   useStore จะทำให้หน้าอัปเดตเองเมื่อข้อมูลเปลี่ยน
//   เช่น ร้านค้าสแกนหัก Token จากอีกแท็บ ยอดบนหน้านี้จะลดลงทันทีโดยไม่ต้องกด refresh

/** ปุ่มจำนวนเติมสำเร็จรูป */
const PRESET_AMOUNTS = [100, 200, 500, 1000];

/** แปลงช่องทางการเติมเป็นข้อความภาษาไทย */
function getChannelLabel(channel: string | undefined) {
  if (channel === "online_qr") return "ออนไลน์ (QR)";
  if (channel === "onsite_cash") return "หน้างาน (เงินสด)";
  if (channel === "onsite_qr") return "หน้างาน (QR)";
  return "";
}

export default function CustomerWalletPage() {
  const { user } = useAuth();
  const wallets = useStore("wallets");
  const transactions = useStore("tokenTransactions");
  const vendors = useStore("vendors");

  // ข้อความที่ลูกค้าพิมพ์ในช่อง "กรอกจำนวนเอง"
  const [amountText, setAmountText] = useState("");
  // ข้อความแจ้งเตือนสีแดง (ว่าง = ไม่มี error)
  const [errorMessage, setErrorMessage] = useState("");
  // ข้อความแจ้งสำเร็จสีเขียว
  const [successMessage, setSuccessMessage] = useState("");
  // จำนวนที่กำลังจะเติม ถ้าเป็น 0 แปลว่ายังไม่ได้เปิดหน้าต่าง QR
  const [topupAmount, setTopupAmount] = useState(0);

  // RoleGuard ใน layout เช็กแล้วว่าล็อกอินอยู่ บรรทัดนี้มีไว้ให้ TypeScript รู้ว่า user ไม่ว่าง
  if (!user) {
    return null;
  }

  const userId = user.id;

  // ───── ยอดคงเหลือ ─────
  // หากระเป๋าของผู้ใช้คนนี้ ถ้ายังไม่เคยมีกระเป๋า (ยังไม่เคยเติม) ให้ยอดเป็น 0
  const myWallet = wallets.find((wallet) => wallet.userId === userId);
  let balance = 0;
  if (myWallet) {
    balance = myWallet.balance;
  }

  // ───── ประวัติ ─────
  // เก็บเฉพาะรายการที่ผู้ใช้คนนี้เป็น "ผู้จ่าย" หรือ "ผู้รับ"
  // ไม่ต้องเรียงลำดับเอง เพราะระบบเก็บรายการใหม่ไว้บนสุดอยู่แล้ว
  const myTransactions = transactions.filter((tx) => {
    return tx.fromUserId === userId || tx.toUserId === userId;
  });

  /** เปิดหน้าต่าง QR เมื่อจำนวนถูกต้อง */
  function openTopup(amount: number) {
    // Token ต้องเป็นจำนวนเต็มมากกว่า 0 (1 Token = 1 บาท ไม่มีเศษสตางค์)
    if (!Number.isInteger(amount) || amount <= 0) {
      setErrorMessage("กรุณากรอกจำนวนเต็มมากกว่า 0");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setTopupAmount(amount);
  }

  /** ปิดหน้าต่าง QR */
  function closeTopup() {
    setTopupAmount(0);
  }

  /** กด "จำลองชำระสำเร็จ" → เพิ่ม Token เข้ากระเป๋าจริง */
  function confirmTopup() {
    // topupOnline จะ throw Error ถ้าจำนวนไม่ถูกต้อง จึงต้องครอบด้วย try/catch
    try {
      topupOnline(userId, topupAmount);
      setSuccessMessage("เติม " + topupAmount.toLocaleString() + " Token สำเร็จ");
      setAmountText("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("เติม Token ไม่สำเร็จ");
      }
    }
    closeTopup();
  }

  /** ชื่อรายการที่แสดงในประวัติ เช่น "หมูปิ้งป้าแดง · หมูปิ้ง ×10" */
  function getTransactionTitle(tx: TokenTransaction) {
    // รายการเติม
    if (tx.type === "topup") {
      return "เติม Token · " + getChannelLabel(tx.channel);
    }

    // รายการจ่ายร้านค้า → หาชื่อร้านจาก vendorId
    if (tx.type === "payment") {
      const vendor = vendors.find((v) => v.id === tx.vendorId);
      let shopName = "ร้านค้า";
      if (vendor) {
        shopName = vendor.shopName;
      }

      // note คือรายละเอียดที่ร้านบันทึกไว้ เช่น "หมูปิ้ง ×10" (บางรายการอาจไม่มี)
      if (tx.note) {
        return shopName + " · " + tx.note;
      }
      return shopName;
    }

    // ลูกค้าไม่มีรายการถอน แต่ใส่ไว้กันกรณีอื่น
    return "ถอน Token";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Token Wallet</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ───── ส่วนที่ 1 + 2: ยอดคงเหลือ และ QR จ่ายร้านค้า ───── */}
        <Card className="flex flex-col items-center text-center">
          <p className="text-sm text-slate-500">ยอด Token คงเหลือ</p>
          <p className="mt-1 text-4xl font-bold text-slate-900">{balance.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Token (1 Token = 1 บาท)</p>

          <div className="mt-6 w-full border-t border-slate-100 pt-6">
            {/* มี Customer ID → แสดง QR (QRDisplay จะแสดงรหัสเป็นตัวหนังสือใต้ QR ให้ด้วย) */}
            {user.customerCode && (
              <QRDisplay
                value={user.customerCode}
                label="ให้ร้านค้าสแกน QR นี้เพื่อชำระด้วย Token"
              />
            )}

            {/* ไม่มี Customer ID → แจ้งให้ติดต่อเจ้าหน้าที่ */}
            {!user.customerCode && (
              <p className="text-sm text-red-600">
                บัญชีนี้ยังไม่มี Customer ID กรุณาติดต่อเจ้าหน้าที่
              </p>
            )}
          </div>
        </Card>

        {/* ───── ส่วนที่ 3: เติม Token ───── */}
        <Card>
          <CardTitle>เติม Token</CardTitle>

          {/* ปุ่มจำนวนสำเร็จรูป */}
          <div className="grid grid-cols-2 gap-2">
            {PRESET_AMOUNTS.map((amount) => (
              <Button key={amount} variant="secondary" onClick={() => openTopup(amount)}>
                {amount.toLocaleString()} Token
              </Button>
            ))}
          </div>

          {/* กรอกจำนวนเอง — กด Enter หรือปุ่ม "เติม" ก็ได้ */}
          <form
            className="mt-4 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault(); // กันไม่ให้หน้า refresh ตอนกด submit
              openTopup(Number(amountText));
            }}
          >
            <div className="flex-1">
              <Input
                label="หรือกรอกจำนวนเอง"
                type="number"
                min={1}
                step={1}
                value={amountText}
                onChange={(event) => setAmountText(event.target.value)}
                placeholder="เช่น 300"
              />
            </div>
            <Button type="submit">เติม</Button>
          </form>

          {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
          {successMessage && <p className="mt-2 text-sm text-green-700">{successMessage}</p>}

          <p className="mt-4 text-xs text-slate-500">
            เติมที่หน้างานได้ด้วย โดยแจ้ง Customer ID กับเจ้าหน้าที่ (เงินสดหรือ QR)
          </p>
        </Card>
      </div>

      {/* ───── ส่วนที่ 4: ประวัติ ───── */}
      <Card>
        <CardTitle>ประวัติการเติมและใช้ Token</CardTitle>

        {myTransactions.length === 0 && (
          <p className="text-sm text-slate-500">ยังไม่มีรายการ</p>
        )}

        <ul className="divide-y divide-slate-100">
          {myTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              title={getTransactionTitle(tx)}
              date={formatEventDate(tx.createdAt)}
              amount={tx.amount}
              isIncoming={tx.toUserId === userId}
            />
          ))}
        </ul>
      </Card>

      {/* ───── หน้าต่าง QR เติม Token (เปิดเมื่อ topupAmount มากกว่า 0) ───── */}
      {topupAmount > 0 && (
        <Modal open onClose={closeTopup} title="เติม Token ด้วย QR">
          <div className="space-y-5">
            <QRDisplay value={"TOPUP:" + userId} size={180} label="สแกนเพื่อชำระเงิน" />

            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">ยอดที่ต้องชำระ</span>
              <span className="text-xl font-bold text-slate-900">
                {topupAmount.toLocaleString()} บาท
              </span>
            </div>

            {/* ตัวต้นแบบไม่ได้ต่อธนาคาร จึงใช้ปุ่มนี้แทนการสแกนจ่ายจริง */}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeTopup}>
                ยกเลิก
              </Button>
              <Button className="flex-1" onClick={confirmTopup}>
                จำลองชำระสำเร็จ
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/**
 * แถวประวัติ 1 รายการ
 * isIncoming = true  → Token เข้า (เติม)   แสดง + สีเขียว
 * isIncoming = false → Token ออก (จ่ายร้าน) แสดง − สีแดง
 */
function TransactionRow({
  title,
  date,
  amount,
  isIncoming,
}: {
  title: string;
  date: string;
  amount: number;
  isIncoming: boolean;
}) {
  let sign = "−";
  let colorClass = "text-red-600";
  if (isIncoming) {
    sign = "+";
    colorClass = "text-green-700";
  }

  return (
    <li className="flex items-center justify-between gap-2 py-3 text-sm">
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-slate-500">{date}</p>
      </div>
      <span className={"font-semibold " + colorClass}>
        {sign}
        {amount.toLocaleString()} Token
      </span>
    </li>
  );
}
