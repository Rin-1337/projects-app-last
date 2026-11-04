# การแบ่งงานและกติกาของทีม

## ใครดูแลอะไร

| คน | ส่วนที่รับผิดชอบ | โฟลเดอร์หน้าเว็บ | service / ข้อมูลที่เป็นเจ้าของ | branch |
|---|---|---|---|---|
| นัฐวิ (PM) | Admin + ส่วนกลาง | `app/admin/` | `wallet.ts`, `users.ts`, `audit.ts`, ฝั่ง Admin ใน `vendors.ts`, ฝั่งอนุมัติใน `withdrawals.ts` | `feat/admin` |
| วิริญา | Organizer – Event & Ticket | `app/organizer/` (ยกเว้น `merch/`) | `events.ts`, `tickets.ts` | `feat/organizer-event` |
| อรอนงค์ | Organizer – Merchandise | `app/organizer/merch/` | `merch.ts` | `feat/organizer-merch` |
| ทิวากร | Customer + Login | `app/customer/`, `app/login`, `app/register`, `app/page.tsx` | `lib/auth.tsx` | `feat/customer` |
| สุรัมภา | Vendor | `app/vendor/` | ฝั่ง Vendor ใน `vendors.ts`, ฝั่งสร้างคำขอใน `withdrawals.ts` | `feat/vendor` |

**ส่วนกลาง (แจ้งนัฐวิก่อนแก้):** `lib/types.ts`, `lib/storage.ts`, `lib/useStore.ts`, `lib/seed.ts`, `components/ui/`, `components/shared/`

## ร้านค้าและการจ่ายเงิน (ตามเจ้าของบรีฟ 4 พ.ย.)
- ร้าน 1 ร้าน ขายสินค้า **1 อย่าง ราคาเดียว** (`Vendor.productName`, `Vendor.priceToken`)
- **Admin** หาร้านเอง สร้างร้าน และ**แก้ราคาได้** — ไม่มีขั้นอนุมัติร้านหรืออนุมัติสินค้าแล้ว
- **จ่ายเงินที่ร้าน:** ลูกค้า**แสดง QR ของตัวเอง** (Customer ID) → ร้านใส่**จำนวน** → สแกน QR ลูกค้า → ยืนยัน → หัก Token (`sellToCustomer` → `pay`)
- **ถอนเงิน:** เหมือนเดิม ร้านขอถอน → Admin อนุมัติ → Admin โอนแล้วบันทึกผล
- **Organizer** ดูรายงานยอดขายร้าน (`vendorSalesReport`) ไว้เคลียร์เงินหลังจบงาน — ดูอย่างเดียว
- `vendors.ts` แบ่ง 3 ส่วน: ฝั่ง Admin (เซน) · ฝั่ง Vendor (นุ่น) · ฝั่ง Organizer (เตย)

## กติกาการเขียนโค้ด
1. ห้ามเรียก `localStorage` ตรง ๆ — อ่านด้วย `useStore("ชื่อข้อมูล")`, เขียนผ่านฟังก์ชันใน `lib/services/`
2. ห้ามเขียนข้อมูลที่คนอื่นเป็นเจ้าของ — เรียกฟังก์ชันใน service ของเจ้าของแทน
3. หน้าที่ใช้ `useStore`, `useState`, `onClick` ต้องมี `"use client"` บรรทัดแรก
4. โปรเจคเปิด `cacheComponents` ไว้ — ถ้าใช้ `usePathname`, `useSearchParams`, `useParams` ใน client component ต้องครอบด้วย `<Suspense>` (ดูตัวอย่างใน `components/shared/RoleShell.tsx`)
5. ฟังก์ชันใน service ที่ยังไม่ได้เขียนจะ throw error "ยังไม่ได้เขียน" — เขียนเสร็จแล้วลบ `notImplemented` ออก
6. หน้า `ComingSoon` มี checklist ของหน้านั้น — ลบออกเมื่อเริ่มเขียนหน้าจริง

## บัญชีทดลอง (รหัสผ่าน 1234)
`somying@test.com` (Customer, C0001) · `organizer@test.com` · `vendor@test.com` · `admin@test.com`

ข้อมูลทดลองอยู่ใน `lib/seed.ts` — ล้างข้อมูลได้โดยลบ key ที่ขึ้นต้นด้วย `ep_` ใน DevTools → Application → Local Storage

## Git (GitHub Desktop)
1. ทำงานบน branch ของตัวเองเท่านั้น — ห้าม commit บน `main`
2. ก่อนเริ่มงานทุกครั้ง: **Branch → Update from main**
3. commit บ่อย ๆ → **Push origin** → งานเสร็จเป็นชิ้นกด **Create Pull Request**
4. นัฐวิ review แล้ว merge
