"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { formatEventDate } from "@/components/customer/common/formatEventDate";
import { QRDisplay } from "@/components/shared/QRDisplay";
import { Button, Modal } from "@/components/ui";
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
//
// หน้าตาแบบ Posh: พื้นดำ (theme posh-dark) ยอด Token ตัวใหญ่ + การ์ด QR รหัสสมาชิก

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

  // จำนวนที่จะเติม (เป็นข้อความ เพราะผูกกับช่องกรอก) — กดปุ่มสำเร็จรูปก็จะเปลี่ยนค่านี้
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

  // ───── จำนวนที่เลือก ─────
  // Token ต้องเป็นจำนวนเต็มมากกว่า 0 (1 Token = 1 บาท ไม่มีเศษสตางค์)
  const selectedAmount = Number(amountText);
  const isValidAmount = Number.isInteger(selectedAmount) && selectedAmount > 0;

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
    <>
      <div className="mx-auto max-w-275 px-5 pt-6 pb-24 sm:px-10">
        {/* ───── ส่วนที่ 1 + 2: ยอดคงเหลือ และ QR จ่ายร้านค้า ───── */}
        <div className="mb-14 flex flex-wrap items-end justify-between gap-8">
          <div>
            <h1 className="mb-2 text-[15px] font-normal text-base-content/60">ยอด Token คงเหลือ</h1>
            <p className="text-[96px] leading-[0.9] font-normal tracking-[-0.06em] sm:text-[168px]">
              {balance.toLocaleString()}
            </p>
            <p className="mt-3 text-[15px] text-base-content/60">Token · 1 Token = 1 บาท</p>
          </div>

          {/* QR ของลูกค้า ให้ร้านค้าสแกนเพื่อหัก Token */}
          {user.customerCode && (
            <div className="flex items-center gap-4.5 rounded-[20px] bg-base-200 p-4.5">
              <div className="flex h-30 w-30 items-center justify-center rounded-xl bg-white">
                <QRCodeSVG value={user.customerCode} size={96} marginSize={0} />
              </div>
              <div className="max-w-50">
                <p className="text-[13px] text-base-content/60">รหัสสมาชิก</p>
                <p className="text-[28px] tracking-[-0.02em]">{user.customerCode}</p>
                <p className="mt-1 text-[13px] text-base-content/60">ให้ร้านค้าสแกน QR นี้เพื่อชำระด้วย Token</p>
              </div>
            </div>
          )}
          {!user.customerCode && (
            <p className="max-w-56 text-sm text-error">บัญชีนี้ยังไม่มี Customer ID กรุณาติดต่อเจ้าหน้าที่</p>
          )}
        </div>

        {/* ───── ส่วนที่ 3: เติม Token ───── */}
        <section className="mb-16 flex flex-col gap-4 rounded-3xl bg-base-200 p-7">
          <h2 className="text-2xl font-normal tracking-[-0.02em]">เติม Token</h2>

          {/* เลือกจำนวนก่อน แล้วกดปุ่มใหญ่ด้านล่าง (กด Enter ในช่องกรอกก็ได้) */}
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault(); // กันไม่ให้หน้า refresh ตอนกด submit
              openTopup(selectedAmount);
            }}
          >
            {/* ปุ่มจำนวนสำเร็จรูป: ปุ่มที่เลือกอยู่เป็นสีดำ (เหมือนปุ่มกรองหมวดหมู่หน้ารายการ Event) */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="จำนวนที่จะเติม">
              {PRESET_AMOUNTS.map((amount) => {
                const isSelected = amount === selectedAmount;
                return (
                  <button
                    key={amount}
                    type="button"
                    aria-pressed={isSelected}
                    className={`btn px-5.5 text-[15px] font-normal ${isSelected ? "btn-neutral" : "bg-base-300"}`}
                    onClick={() => setAmountText(String(amount))}
                  >
                    {amount.toLocaleString()} Token
                  </button>
                );
              })}
            </div>

            <label className="flex max-w-xs flex-col gap-1.5">
              <span className="text-[13px] text-base-content/60">หรือกรอกจำนวนเอง</span>
              <input
                className="input w-full border-0 bg-base-300 px-5"
                type="number"
                min={1}
                step={1}
                value={amountText}
                onChange={(event) => setAmountText(event.target.value)}
                placeholder="เช่น 300"
              />
            </label>

            {/* ปุ่มใหญ่บอกยอดก่อนจ่าย (แบบเดียวกับปุ่ม "ไปหน้าชำระเงิน" ตอนซื้อบัตร) */}
            <button type="submit" className="btn btn-primary btn-block h-14 text-base font-normal" disabled={!isValidAmount}>
              {isValidAmount
                ? `เติม ${selectedAmount.toLocaleString()} Token · ${selectedAmount.toLocaleString()} บาท`
                : "เลือกจำนวนที่จะเติม"}
            </button>
          </form>

          {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
          {successMessage && <p className="text-sm text-success">{successMessage}</p>}

          <p className="text-[13px] text-base-content/60">
            เติมที่หน้างานได้ด้วย โดยแจ้ง Customer ID กับเจ้าหน้าที่ (เงินสดหรือ QR)
          </p>
        </section>

        {/* ───── ส่วนที่ 4: ประวัติ ───── */}
        <section>
          <h2 className="mb-3 text-[32px] font-normal tracking-[-0.03em]">ประวัติการเติมและใช้ Token</h2>

          {myTransactions.length === 0 && <p className="text-base-content/60">ยังไม่มีรายการ</p>}

          <ul>
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
        </section>
      </div>

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
    </>
  );
}

/**
 * แถวประวัติ 1 รายการ
 * isIncoming = true  → Token เข้า (เติม)   แสดง + สีเขียว
 * isIncoming = false → Token ออก (จ่ายร้าน) แสดง − สีปกติ
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
  let colorClass = "";
  if (isIncoming) {
    sign = "+";
    colorClass = "text-success";
  }

  return (
    <li className="flex items-center justify-between gap-4 border-b border-base-300 py-4.5">
      <div>
        <p className="text-base">{title}</p>
        <p className="text-[13px] text-base-content/60">{date}</p>
      </div>
      <span className={"text-lg tabular-nums " + colorClass}>
        {sign}
        {amount.toLocaleString()}
      </span>
    </li>
  );
}
