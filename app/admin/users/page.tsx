import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminUsersPage() {
  return (
    <ComingSoon
      title="จัดการบัญชีผู้ใช้"
      owner="นัฐวิ"
      todo={["รายการผู้ใช้ทุก Role + ค้นหา", "สร้างบัญชี Organizer / Vendor (createStaffAccount)", "ระงับ / เปิดใช้งานบัญชี"]}
    />
  );
}
