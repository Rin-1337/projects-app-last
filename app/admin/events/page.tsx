import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminEventsPage() {
  return (
    <ComingSoon
      title="จัดการ Event ทั้งหมด"
      owner="นัฐวิ"
      todo={["รายการ Event ทุกงาน", "กำหนด Organizer ให้รับผิดชอบ Event"]}
    />
  );
}
