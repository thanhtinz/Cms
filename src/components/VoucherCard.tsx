"use client";

import { useState } from "react";
import type { Voucher } from "@prisma/client";
import { describeVoucher } from "@/lib/voucher-shared";
import { formatDate } from "@/lib/utils";
import { TicketIcon } from "./icons";

// The voucher hien cong khai o trang chu — bam de sao chep ma.
export default function VoucherCard({ v }: { v: Voucher }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(v.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  const main =
    v.type === "PERCENT" ? `−${v.value}%` : `−${v.value.toLocaleString("vi-VN")} ₫`;
  return (
    <div className="flex overflow-hidden rounded-2xl border border-dashed border-brand-300 bg-gradient-to-r from-brand-50 to-white shadow-sm">
      <div className="flex w-28 shrink-0 flex-col items-center justify-center bg-brand-600 px-2 py-4 text-center text-white">
        <TicketIcon className="h-6 w-6 opacity-80" />
        <div className="mt-1 text-lg font-black leading-none">{main}</div>
      </div>
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-base font-black tracking-wide text-slate-900">{v.code}</span>
          <button onClick={copy} className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">
            {copied ? "Đã chép" : "Sao chép mã"}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">{v.description || describeVoucher(v)}</p>
        <p className="mt-1 text-xs text-slate-400">
          {describeVoucher(v)}
          {v.expiresAt ? ` · HSD: ${formatDate(v.expiresAt)}` : ""}
          {v.usageLimit > 0 ? ` · Còn ${Math.max(0, v.usageLimit - v.usedCount)} lượt` : ""}
        </p>
      </div>
    </div>
  );
}
