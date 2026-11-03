import { ComingSoon } from "@/components/shared/ComingSoon";

// ผู้รับผิดชอบ: ทิวากร
export default function CustomerEventsPage() {
  return (
    <ComingSoon
      title="รายการ Event"
      owner="ปอ"
      todo={["แสดง Event ที่เปิดขาย (listPublishedEvents)", "ประเภทบัตร ราคา จำนวนคงเหลือ"]}
    />
  );
}
