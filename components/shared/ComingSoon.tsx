import { Card } from "@/components/ui";

/** หน้าชั่วคราวที่บอกว่าหน้านี้ใครรับผิดชอบและต้องทำอะไร — ลบออกเมื่อเริ่มเขียนหน้าจริง */
export function ComingSoon({
  title,
  owner,
  todo,
}: {
  title: string;
  owner: string;
  todo: string[];
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
        ยังไม่ได้ทำ · ผู้รับผิดชอบ: {owner}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-slate-700">
        {todo.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </Card>
  );
}
