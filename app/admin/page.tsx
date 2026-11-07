import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: นัฐวิ
export default function AdminPage() {
  return (
    <ComingSoon
      title="Dashboard ภาพรวมระบบ eieieieiei"
      owner="นัฐวิ"
      todo={["จำนวนผู้ใช้แต่ละ Role", "ยอด Token ในระบบ / ยอดเติม / ยอดถอน", "คำขอที่รออนุมัติ"]}
    />
  );
}
