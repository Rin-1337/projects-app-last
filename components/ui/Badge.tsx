import type { ReactNode } from "react";

type Tone = "gray" | "blue" | "green" | "yellow" | "red";

const tones: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** สีมาตรฐานของสถานะต่าง ๆ ใช้ให้เหมือนกันทั้งระบบ */
export const STATUS_TONE: Record<string, Tone> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
  transferred: "blue",
  paid: "green",
  cancelled: "gray",
  refunded: "gray",
  active: "green",
  suspended: "red",
};
