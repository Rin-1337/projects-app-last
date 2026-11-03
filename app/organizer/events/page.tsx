import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: วิริญา
export default function OrganizerEventsPage() {
  return (
    <ComingSoon
      title="จัดการ Event"
      owner="เตย"
      todo={["รายการ Event ที่รับผิดชอบ", "สร้าง / แก้ไขรายละเอียด Event"]}
    />
  );
}
