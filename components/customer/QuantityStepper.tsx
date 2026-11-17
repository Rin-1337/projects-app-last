/**
 * ปุ่มปรับจำนวน  [ − ]  2  [ + ]   — ผู้รับผิดชอบ: ทิวากร
 * ใช้ทั้งในการ์ดสินค้าและหน้าตะกร้า
 */
export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (newValue: number) => void;
}) {
  const canDecrease = value > 1;
  const canIncrease = value < max;

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300">
      <button
        type="button"
        aria-label="ลดจำนวน"
        className="px-3 py-1 text-lg disabled:opacity-40"
        disabled={!canDecrease}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>

      <span className="w-8 text-center text-sm font-medium">{value}</span>

      <button
        type="button"
        aria-label="เพิ่มจำนวน"
        className="px-3 py-1 text-lg disabled:opacity-40"
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
