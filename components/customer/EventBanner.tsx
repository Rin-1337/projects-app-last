import Image from "next/image";
import Link from "next/link";
import type { EventItem } from "@/lib/types";
import { formatEventDate } from "./formatEventDate";

/** แบนเนอร์งานถัดไป ถ้างานไม่มีรูปปกจะเป็นพื้นสีน้ำเงิน */
export function EventBanner({ event }: { event: EventItem }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-700 to-slate-900 text-white">
      {event.coverImage && (
        <>
          {/* unoptimized = ใช้รูปตามที่กรอกมาเลย เพราะไม่รู้ล่วงหน้าว่ารูปอยู่เว็บไหน */}
          <Image src={event.coverImage} alt="" fill unoptimized preload className="object-cover" />
          {/* ชั้นสีเข้มทับรูป ให้อ่านตัวหนังสือสีขาวได้ */}
          <div className="absolute inset-0 bg-slate-900/60" />
        </>
      )}

      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-sm font-medium text-blue-100">งานถัดไป</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{event.title}</h1>
        <p className="mt-3 max-w-2xl text-slate-100">{event.description}</p>
        <p className="mt-4 text-sm text-slate-200">
          {formatEventDate(event.startAt)} · {event.location}
        </p>
        <Link
          href={`/customer/events/${event.id}`}
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 font-medium text-blue-700 hover:bg-blue-50"
        >
          ซื้อบัตร
        </Link>
      </div>
    </section>
  );
}
