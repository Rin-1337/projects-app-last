/** แปลงวันเวลาของงานเป็นข้อความภาษาไทย เช่น "12 ธันวาคม 2569 เวลา 17:00" */
export function formatEventDate(date: string) {
  return new Date(date).toLocaleString("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}
