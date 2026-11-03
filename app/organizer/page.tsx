import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: วิริญา
export default function OrganizerPage() {
  return (
    <ComingSoon
      title="Dashboard ผู้จัดงาน"
      owner="เตย"
      todo={["ภาพรวม Event ที่รับผิดชอบ", "ยอดขายบัตร / ผู้เข้าร่วม / เช็กอินแล้ว"]}
    />
  );
}
