/**
 * แถบบอกขั้นตอน:  ① ตะกร้า › ② ที่อยู่จัดส่ง › ③ ชำระเงิน › ④ เสร็จสิ้น
 * ผู้รับผิดชอบ: ทิวากร
 *
 * วิธีใช้: <CheckoutSteps current={0} />   (0 = ตะกร้า, 1 = ที่อยู่, 2 = ชำระเงิน, 3 = เสร็จสิ้น)
 */

const STEPS = ["ตะกร้า", "ที่อยู่จัดส่ง", "ชำระเงิน", "เสร็จสิ้น"];

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          <StepCircle index={index} current={current} />
          <span className={index === current ? "font-medium text-slate-900" : "text-slate-500"}>
            {label}
          </span>
          {index < STEPS.length - 1 && <span className="text-slate-300">›</span>}
        </li>
      ))}
    </ol>
  );
}

/** วงกลมตัวเลข: ผ่านแล้ว = เขียว ✓, ขั้นปัจจุบัน = น้ำเงิน, ยังไม่ถึง = เทา */
function StepCircle({ index, current }: { index: number; current: number }) {
  let color = "bg-slate-200 text-slate-500"; // ยังไม่ถึง
  let text = String(index + 1);

  if (index < current) {
    color = "bg-green-600 text-white"; // ผ่านแล้ว
    text = "✓";
  } else if (index === current) {
    color = "bg-blue-600 text-white"; // ขั้นปัจจุบัน
  }

  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${color}`}
    >
      {text}
    </span>
  );
}
