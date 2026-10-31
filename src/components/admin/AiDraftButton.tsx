"use client";

import { useState } from "react";

// Nut "AI soan tra loi": goi /api/ai-soan-tra-loi roi dien ban nhap vao o
// tra loi (theo id) de admin doc lai/sua truoc khi gui. AI khong tu gui.
export default function AiDraftButton({ ticketId, targetId }: { ticketId: string; targetId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ai-soan-tra-loi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok && data?.draft) {
        const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
        if (el) {
          el.value = data.draft;
          el.focus();
          setMsg("AI đã soạn xong — bạn đọc lại rồi bấm Gửi trả lời.");
        } else {
          setMsg("Không tìm thấy ô trả lời để điền bản nháp.");
        }
      } else {
        setMsg(data?.message ?? "AI chưa trả lời được — thử lại sau.");
      }
    } catch {
      setMsg("Lỗi kết nối khi gọi AI — thử lại sau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
      >
        <i className={`fa-solid ${busy ? "fa-circle-notch fa-spin" : "fa-wand-magic-sparkles"} mr-1.5`} aria-hidden />
        {busy ? "AI đang soạn..." : "AI soạn trả lời"}
      </button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </span>
  );
}
