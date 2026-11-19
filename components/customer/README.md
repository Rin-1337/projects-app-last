# components/customer

component ที่ใช้เฉพาะส่วนลูกค้า — เจ้าของ: ทิวากร

แยกโฟลเดอร์ตามหน้าที่ใช้ component นั้น จะได้รู้ว่าแก้ไฟล์นี้แล้วกระทบหน้าไหน

| โฟลเดอร์ | ใช้ในหน้า | ไฟล์ |
|---|---|---|
| `common/` | ใช้หลายหน้า | `CustomerShell` (header แบบ Posh ใช้แทน RoleShell), `Flyer` (ใบปิดงาน + สีประจำงาน), `categories` (หมวดหมู่งาน), `styles` (class หัวข้อ + รายชื่อหน้าพื้นดำ), `EventCard`, `nav` (เมนูลูกค้า), `formatEventDate`, `getPublishedEvents`, `useIsClient` |
| `events/` | หน้ารายละเอียดงาน `app/customer/events/[id]` | `BuyTicketForm`, `PaymentModal` |
| `tickets/` | บัตรของฉัน `app/customer/tickets` | `TicketCard` |
| `shop/` | ร้านค้า `app/customer/shop` | `ProductCard`, `CartPanel`, `useCart` (ตะกร้า), `getCartRows` |
| `checkout/` | สั่งซื้อ `app/customer/shop/checkout` | `AddressForm`, `OrderSummary`, `MerchPaymentModal` |
| `orders/` | ประวัติคำสั่งซื้อ `app/customer/orders` | `MerchOrderCard` |
| `profile/` | โปรไฟล์ `app/customer/profile` | `ProfileForm`, `PasswordForm` |

หมายเหตุ: หน้า checkout ใช้ `useCart` และ `getCartRows` จากโฟลเดอร์ `shop/` ด้วย เพราะเป็นตะกร้าใบเดียวกัน
หน้า orders ใช้ `MerchPaymentModal` จาก `checkout/` (ให้จ่ายคำสั่งซื้อที่ค้างไว้ต่อได้) และ `getSizeLabel` จาก `shop/`

## หน้าตา (แบบ Posh ด้วย daisyUI)

- ใช้ class ของ daisyUI (`btn`, `input` …) สีมาจาก theme ใน `app/globals.css` ส่วนขนาดตัวอักษร/ระยะใช้ค่าตามไฟล์ design (Tailwind เช่น `text-[120px]`)
- ฟอนต์ Inter + IBM Plex Sans Thai ตั้งไว้ใน `CustomerShell`
- สีประจำงาน (ใบปิด + ปุ่ม) มาจาก `getEventColor()` ใน `Flyer.tsx`
- theme `posh` (พื้นขาว) เป็นค่าเริ่มต้น / หน้าพื้นดำ (รายละเอียดงาน บัตรของฉัน Wallet) กำหนดใน `isDarkPage()` ของ `common/styles.ts` ที่เดียว — `CustomerShell` ใส่ `data-theme="posh-dark"` ให้ทั้งหน้าเอง
- หัวข้อใหญ่ของหน้าใช้ `PAGE_TITLE` / `PAGE_TITLE_SM` จาก `common/styles.ts`
- ไม่ใช้ `components/ui` ในหน้าลูกค้า ยกเว้น `Modal` (หน้าต่าง QR)
- แต่ละหน้าจัดความกว้างเอง: หน้าแรก / รายการ Event / ของที่ระลึก เต็มจอ (`px-5 sm:px-10`) หน้าอื่นจำกัดความกว้าง เช่น `mx-auto max-w-300`
