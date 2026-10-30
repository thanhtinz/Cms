"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "bot" | "user"; text: string };

const GREETING =
  "Xin chào! Mình là trợ lý hỗ trợ tự động của nền tảng. Mình trả lời ngay các câu hỏi về gói thời gian, giá, tên miền/Cloudflare, thanh toán, voucher và gia hạn — cứ hỏi tự nhiên nhé.";

// Widget tro ly AI: hoi dap tuc thi, tra loi tu du lieu nen tang (FAQ, goi, voucher, cai dat)
export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [sugs, setSugs] = useState<string[]>(["Giá các gói thời gian?", "Tên miền cần gì?", "Thanh toán thế nào?", "Mã voucher đang có"]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !started) {
      setStarted(true);
      setMsgs([{ role: "bot", text: GREETING }]);
    }
  }, [open, started]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/tro-ly", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "bot", text: data.answer ?? "Xin lỗi, mình chưa trả lời được câu này." }]);
      if (Array.isArray(data.suggestions) && data.suggestions.length) setSugs(data.suggestions);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Mất kết nối — bạn thử lại sau ít phút, hoặc gửi yêu cầu ở mục Hỗ trợ để đội hỗ trợ phản hồi." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-2xl shadow-brand-600/40 transition hover:scale-105"
        aria-label="Mở trợ lý hỗ trợ"
        title="Trợ lý hỗ trợ AI"
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-comments"} text-xl`} aria-hidden />
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[90] flex h-[540px] max-h-[calc(100vh-8rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-3 text-white">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600">
              <i className="fa-solid fa-robot" aria-hidden />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
            </span>
            <div className="leading-tight">
              <div className="font-bold">Trợ lý hỗ trợ AI</div>
              <div className="text-xs text-slate-300">Trả lời tức thì từ dữ liệu nền tảng</div>
            </div>
          </div>

          <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user" ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
                  <i className="fa-solid fa-circle-notch fa-spin mr-2" aria-hidden /> Đang trả lời...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white px-3 pt-2">
            <div className="flex flex-wrap gap-1.5 pb-2">
              {sugs.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100">
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 pb-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="input flex-1"
              />
              <button className="btn-primary h-10 w-10 shrink-0 !px-0" aria-label="Gửi">
                <i className="fa-solid fa-paper-plane" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
