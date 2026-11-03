import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: วิริญา
export default function OrganizerCheckinPage() {
  return (
    <ComingSoon
      title="Check-in"
      owner="เตย"
      todo={["สแกน/กรอกรหัส QR บัตร (checkIn)", "แจ้งผล: สำเร็จ / เช็กอินซ้ำ / บัตรไม่ถูกต้อง"]}
    />
  );
}
