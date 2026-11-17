"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Card, CardTitle, Input } from "@/components/ui";
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
 */
export function BuyTicketForm({
  ticketTypes,
  onOrderCreated,
}: {
  ticketTypes: TicketType[];
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
    return (
      <Card>
        <p className="text-sm text-slate-600">งานนี้ยังไม่เปิดจำหน่ายบัตร</p>
      </Card>
    );
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

  return (
    <Card>
      <CardTitle>ซื้อบัตร</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. เลือกประเภทบัตร */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-slate-700">ประเภทบัตร</legend>

          {ticketTypes.map((ticketType) => {
            const left = ticketType.quota - ticketType.sold;
            const isSoldOut = left <= 0;

            return (
              <label
                key={ticketType.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                  selectedId === ticketType.id ? "border-blue-600 bg-blue-50" : "border-slate-200"
                } ${isSoldOut ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="ticketType"
                    checked={selectedId === ticketType.id}
                    disabled={isSoldOut}
                    onChange={() => selectTicketType(ticketType)}
                  />
                  <span className="font-medium text-slate-800">{ticketType.name}</span>
                </span>

                <span className="flex items-center gap-3">
                  {isSoldOut ? (
                    <Badge tone="red">บัตรหมด</Badge>
                  ) : (
                    <span className="text-slate-500">เหลือ {left.toLocaleString()} ใบ</span>
                  )}
                  <span className="font-semibold text-slate-900">
                    {ticketType.price.toLocaleString()} บาท
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {/* บัตรหมดทุกประเภท ไม่ต้องแสดงส่วนที่เหลือ */}
        {selected && (
          <>
            {/* 2. จำนวนบัตร */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">จำนวนบัตร</p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={removeTicket} disabled={quantity <= 1}>
                  −
                </Button>
                <span className="w-8 text-center text-lg font-semibold">{quantity}</span>
                <Button variant="secondary" onClick={addTicket} disabled={quantity >= maxQuantity}>
                  +
                </Button>
                <span className="text-xs text-slate-500">สูงสุด {maxQuantity} ใบ</span>
              </div>
            </div>

            {/* 3. ชื่อผู้เข้าร่วมงาน 1 ช่องต่อบัตร 1 ใบ */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">ชื่อผู้เข้าร่วมงาน</p>
              {attendeeNames.map((name, index) => (
                <Input
                  key={index}
                  label={`บัตรใบที่ ${index + 1}`}
                  placeholder="ชื่อ-นามสกุล"
                  value={name}
                  onChange={(e) => changeName(index, e.target.value)}
                />
              ))}
            </div>

            {/* 4. ยอดรวม + ปุ่มยืนยัน */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-600">ยอดรวม</span>
              <span className="text-xl font-bold text-slate-900">
                {total.toLocaleString()} บาท
              </span>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" size="lg" className="w-full">
              ไปหน้าชำระเงิน
            </Button>
          </>
        )}
      </form>
    </Card>
  );
}
