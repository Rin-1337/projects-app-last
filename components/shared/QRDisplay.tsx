"use client";

import { QRCodeSVG } from "qrcode.react";

export interface QRDisplayProps {
    value: string;
    label?: string;
    size?: number;
}

export function QRDisplay({ value, label, size = 200 }: QRDisplayProps) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <QRCodeSVG value={value} size={size} level="M" marginSize={0} />
            </div>
            <p className="font-mono text-lg font-semibold tracking-widest text-slate-900">
                {value}
            </p>
            {label && <p className="text-sm text-slate-500">{label}</p>}
        </div>
    );
}