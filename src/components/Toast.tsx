"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Toast = { id: number; kind: "ok" | "loi"; text: string };

// Thong bao noi (toast) toan cuc: doc tham so ?tb= ?ok= ?loi= sau moi lan
// dieu huong (dang nhap, dang xuat, luu du lieu, dat don...) roi tu an.
export default function Toasts() {
  const params = useSearchParams();
  const pathname = usePathname();
  const [list, setList] = useState<Toast[]>([]);
  const lastKey = useRef("");

  useEffect(() => {
    const tb = params.get("tb");
    const ok = params.get("ok");
    const loi = params.get("loi");
    const key = `${pathname}|${tb}|${ok}|${loi}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    const fresh: Toast[] = [];
    if (tb) fresh.push({ id: Date.now() + 1, kind: "ok", text: tb });
    if (ok) fresh.push({ id: Date.now() + 2, kind: "ok", text: ok });
    if (loi) fresh.push({ id: Date.now() + 3, kind: "loi", text: loi });
    if (fresh.length === 0) return;
    setList((prev) => [...prev, ...fresh]);
    // don tham so khoi URL de F5 khong hien lai
    const url = new URL(window.location.href);
    ["tb", "ok", "loi"].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    const timers = fresh.map((t) => setTimeout(() => setList((prev) => prev.filter((x) => x.id !== t.id)), 5200));
    return () => timers.forEach(clearTimeout);
  }, [params, pathname]);

  if (list.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-2xl ring-1 backdrop-blur ${
            t.kind === "ok"
              ? "bg-emerald-600/95 text-white ring-emerald-400/50"
              : "bg-red-600/95 text-white ring-red-400/50"
          }`}
          role="status"
        >
          <i className={`fa-solid ${t.kind === "ok" ? "fa-circle-check" : "fa-circle-exclamation"} mt-0.5 text-base`} aria-hidden />
          <span className="flex-1 leading-snug">{t.text}</span>
          <button
            onClick={() => setList((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-80 transition hover:opacity-100"
            aria-label="Đóng thông báo"
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
