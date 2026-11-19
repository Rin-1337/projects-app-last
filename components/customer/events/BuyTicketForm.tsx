"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { createTicketOrder } from "@/lib/services/tickets";
import type { TicketOrder, TicketType } from "@/lib/types";

/** ซื้อได้ไม่เกินกี่ใบต่อครั้ง */
const MAX_PER_ORDER = 10;

/**
 * ฟอร์มซื้อบัตร: เลือกประเภทบัตร → กำหนดจำนวน → กรอกชื่อผู้เข้าร่วมงาน
 * กดยืนยันแล้วจะสร้างคำสั่งซื้อ (ยังไม่จ่าย) แล้วส่งกลับไปให้หน้าแม่เปิดหน้าชำระเงิน
 *
 * จำนวนบัตร = จำนวนช่องชื่อ (attendeeNames.length) ไม่ต้องเก็บแยกอีกตัว
 * ใช้บนหน้าพื้นดำ (theme posh-dark)
 */
export function BuyTicketForm({
  ticketTypes,
  accent,
  onOrderCreated,
}: {
  ticketTypes: TicketType[];
  /** สีประจำงาน ใช้กับขอบบัตรที่เลือกและปุ่มชำระเงิน */
  accent: string;
  onOrderCreated: (order: TicketOrder) => void;
}) {
  const { user } = useAuth();

  // เริ่มต้นเลือกบัตรประเภทแรกที่ยังไม่หมด
  const firstAvailable = ticketTypes.find((t) => t.quota - t.sold > 0);
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? "");
  // ช่องชื่อช่องแรกใส่ชื่อผู้ใช้ไว้ให้ก่อน
  const [attendeeNames, setAttendeeNames] = useState([user?.name ?? ""]);
  const [error, setError] = useState("");

  const selected = ticketTypes.find((t) => t.id === selectedId);
  const remaining = selected ? selected.quota - selected.sold : 0;
  const maxQuantity = Math.min(remaining, MAX_PER_ORDER);
  const quantity = attendeeNames.length;
  const total = selected ? selected.price * quantity : 0;

  if (ticketTypes.length === 0) {
    return <p className="rounded-2xl bg-base-200 p-6 text-base-content/60">งานนี้ยังไม่เปิดจำหน่ายบัตร</p>;
  }

  function selectTicketType(ticketType: TicketType) {
    setSelectedId(ticketType.id);
    setError("");

    // ถ้าบัตรประเภทใหม่เหลือน้อยกว่าจำนวนที่เลือกไว้ ให้ตัดช่องชื่อที่เกินออก
    const newMax = Math.min(ticketType.quota - ticketType.sold, MAX_PER_ORDER);
    if (attendeeNames.length > newMax) {
      setAttendeeNames(attendeeNames.slice(0, Math.max(newMax, 1)));
    }
  }

  function addTicket() {
    setAttendeeNames([...attendeeNames, ""]);
  }

  function removeTicket() {
    setAttendeeNames(attendeeNames.slice(0, -1));
  }

  function changeName(index: number, name: string) {
    const newNames = [...attendeeNames];
    newNames[index] = name;
    setAttendeeNames(newNames);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // กันหน้าเว็บโหลดใหม่ตอนกด submit
    if (!user || !selected) return;

    if (attendeeNames.some((name) => name.trim() === "")) {
      setError("กรุณากรอกชื่อผู้เข้าร่วมงานให้ครบทุกใบ");
      return;
    }

    // createTicketOrder จะ throw Error ถ้าข้อมูลไม่ผ่าน เช่น บัตรเพิ่งหมด
    try {
      const order = createTicketOrder({
        customerId: user.id,
        ticketTypeId: selected.id,
        quantity,
        attendeeNames,
      });
      setError("");
      onOrderCreated(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "สั่งซื้อไม่สำเร็จ");
    }
  }

  /** หัวข้อของแต่ละขั้น */
  const STEP_TITLE = "mb-1 text-[15px] font-medium text-base-content/60";
  /** ปุ่ม +/− วงกลม */
  const ROUND_BUTTON = "btn btn-circle h-11 w-11 bg-base-300 text-xl font-normal";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 1. เลือกประเภทบัตร */}
      <fieldset className="flex flex-col gap-2">
        <legend className={STEP_TITLE}>1. เลือกประเภทบัตร</legend>

        {ticketTypes.map((ticketType) => {
          const left = ticketType.quota - ticketType.sold;
          const isSoldOut = left <= 0;
          const isSelected = selectedId === ticketType.id;

          return (
            <label
              key={ticketType.id}
              className={`flex min-h-16 items-center justify-between gap-3 rounded-[14px] border-2 px-4.5 py-3 ${
                isSoldOut ? "cursor-not-allowed border-[#1F1F1F] bg-[#121212] opacity-50" : "cursor-pointer border-transparent bg-base-200"
              }`}
              style={isSelected ? { borderColor: accent } : undefined}
            >
              {/* radio ซ่อนไว้ แต่ยังกดด้วยคีย์บอร์ดได้ */}
              <input
                type="radio"
                name="ticketType"
                className="sr-only"
                checked={isSelected}
                disabled={isSoldOut}
                onChange={() => selectTicketType(ticketType)}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-medium">{ticketType.name}</span>
                <span className="text-[13px] text-base-content/60">
                  {isSoldOut ? "บัตรหมด" : `เหลือ ${left.toLocaleString()} ใบ`}
                </span>
              </span>
              <span className="text-base">{ticketType.price.toLocaleString()} บาท</span>
            </label>
          );
        })}
      </fieldset>

      {/* บัตรหมดทุกประเภท ไม่ต้องแสดงส่วนที่เหลือ */}
      {selected && (
        <>
          {/* 2. จำนวนบัตร */}
          <div>
            <p className={STEP_TITLE}>2. จำนวนบัตร</p>
            <div className="flex items-center justify-between rounded-[14px] bg-base-200 px-4.5 py-3.5">
              <span className="text-base">{selected.name}</span>
              <div className="flex items-center gap-2.5">
                <button type="button" aria-label="ลดจำนวนบัตร" className={ROUND_BUTTON} onClick={removeTicket} disabled={quantity <= 1}>
                  −
                </button>
                <span className="w-7 text-center text-lg font-medium">{quantity}</span>
                <button type="button" aria-label="เพิ่มจำนวนบัตร" className={ROUND_BUTTON} onClick={addTicket} disabled={quantity >= maxQuantity}>
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. ชื่อผู้เข้าร่วมงาน 1 ช่องต่อบัตร 1 ใบ */}
          <div className="flex flex-col gap-2">
            <p className={STEP_TITLE}>3. ชื่อผู้เข้าร่วมงาน</p>
            {attendeeNames.map((name, index) => (
              <label key={index} className="flex flex-col gap-1.5 rounded-[14px] bg-base-200 px-4.5 py-3">
                <span className="text-[13px] text-base-content/60">บัตรใบที่ {index + 1}</span>
                <input
                  className="bg-transparent py-1 text-base outline-none placeholder:text-base-content/60"
                  placeholder="ชื่อ-นามสกุล"
                  value={name}
                  onChange={(e) => changeName(index, e.target.value)}
                />
              </label>
            ))}
          </div>

          {/* 4. ยอดรวม + ปุ่มยืนยัน */}
          <div className="flex flex-col gap-3.5 border-t border-base-300 pt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] text-base-content/60">ยอดรวม · {quantity} ใบ</span>
              <span className="text-[44px] font-medium tracking-[-0.03em]">{total.toLocaleString()} บาท</span>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <button
              type="submit"
              className="btn h-14 text-base font-normal text-white"
              style={{ backgroundColor: accent, borderColor: accent }}
            >
              ไปหน้าชำระเงิน
            </button>
            <span className="text-center text-[13px] text-base-content/60">
              ระบบต้นแบบ ใช้ปุ่มจำลองชำระสำเร็จแทนการสแกนจ่ายจริง
            </span>
          </div>
        </>
      )}
    </form>
  );
}
