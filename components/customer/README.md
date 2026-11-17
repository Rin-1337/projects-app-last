# components/customer

component ที่ใช้เฉพาะส่วนลูกค้า — เจ้าของ: ทิวากร

แยกโฟลเดอร์ตามหน้าที่ใช้ component นั้น จะได้รู้ว่าแก้ไฟล์นี้แล้วกระทบหน้าไหน

| โฟลเดอร์ | ใช้ในหน้า | ไฟล์ |
|---|---|---|
| `common/` | ใช้หลายหน้า | `nav` (เมนูลูกค้า), `formatEventDate`, `getPublishedEvents`, `useIsClient`, `EventCard` |
| `home/` | หน้าแรก `app/page.tsx` | `EventBanner`, `HomeHeader` |
| `events/` | หน้ารายละเอียดงาน `app/customer/events/[id]` | `BuyTicketForm`, `PaymentModal` |
| `tickets/` | บัตรของฉัน `app/customer/tickets` | `TicketCard` |
| `shop/` | ร้านค้า `app/customer/shop` | `ProductCard`, `CartPanel`, `useCart` (ตะกร้า), `getCartRows` |
| `checkout/` | สั่งซื้อ `app/customer/shop/checkout` | `AddressForm`, `OrderSummary`, `MerchPaymentModal` |
| `orders/` | ประวัติคำสั่งซื้อ `app/customer/orders` | `MerchOrderCard` |
| `profile/` | โปรไฟล์ `app/customer/profile` | `ProfileForm`, `PasswordForm` |

หมายเหตุ: หน้า checkout ใช้ `useCart` และ `getCartRows` จากโฟลเดอร์ `shop/` ด้วย เพราะเป็นตะกร้าใบเดียวกัน
หน้า orders ใช้ `MerchPaymentModal` จาก `checkout/` (ให้จ่ายคำสั่งซื้อที่ค้างไว้ต่อได้) และ `getSizeLabel` จาก `shop/`
