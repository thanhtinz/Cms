"use client";

import { useState } from "react";

// Nut sao chep van ban (key kich hoat, ma voucher...)
export default function CopyText({ text, label = "Sao chép" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
        copied ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-700"
      }`}
    >
      <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`} aria-hidden />
      {copied ? "Đã chép" : label}
    </button>
  );
}
