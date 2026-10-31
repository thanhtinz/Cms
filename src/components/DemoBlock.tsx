"use client";

import { useState } from "react";

// Khoi "Live demo" o trang chi tiet mau (phong cach cac san ban source
// chuyen nghiep): link trang khach + Admin Panel cua ban demo, thong tin
// dang nhap demo kem nut chep, va website that dang kinh doanh bang mau nay.
// Phan nao chua cau hinh trong Admin thi khong hien phan do.
function hostOf(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Sao chép"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${copied ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
    >
      <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`} aria-hidden />
    </button>
  );
}

function DemoRow({ icon, chipClass, title, url }: { icon: string; chipClass: string; title: string; url: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3.5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${chipClass}`}>
        <i className={`fa-solid ${icon}`} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-slate-900">{title}</span>
        <span className="block truncate text-sm text-slate-500">{hostOf(url)}</span>
      </span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Mở ${title}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700"
      >
        <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />
      </a>
    </div>
  );
}

export default function DemoBlock({
  demoUrl,
  demoAdminUrl,
  demoAccount,
  demoPassword,
  liveSiteUrl,
}: {
  demoUrl?: string | null;
  demoAdminUrl?: string | null;
  demoAccount?: string | null;
  demoPassword?: string | null;
  liveSiteUrl?: string | null;
}) {
  if (!demoUrl && !demoAdminUrl) return null;
  const bullets = [
    "Key kích hoạt riêng cho từng lần thuê — kiểm tra bản quyền công khai tại trang Kiểm tra key",
    "Thanh toán tự động qua SePay, website được tạo ngay khi tiền về",
    "Gia hạn cộng dồn từ ngày hết hạn hiện tại — không mất ngày thuê",
  ];
  return (
    <div className="card mt-6 p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-lg text-sky-600">
          <i className="fa-solid fa-display" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight text-slate-900">Live demo</h2>
          <p className="text-sm text-slate-500">Trải nghiệm giao diện thực tế trước khi thuê.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {demoUrl && <DemoRow icon="fa-user" chipClass="bg-sky-50 text-sky-600" title="Trang khách" url={demoUrl} />}
        {demoAdminUrl && <DemoRow icon="fa-key" chipClass="bg-violet-50 text-violet-600" title="Admin Panel" url={demoAdminUrl} />}
      </div>

      {demoAccount && demoPassword && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <i className="fa-solid fa-key" aria-hidden /> Thông tin đăng nhập
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tài khoản</span>
                <span className="block truncate font-bold text-slate-900">{demoAccount}</span>
              </span>
              <CopyBtn text={demoAccount} />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mật khẩu</span>
                <span className="block truncate font-bold text-slate-900">{demoPassword}</span>
              </span>
              <CopyBtn text={demoPassword} />
            </div>
          </div>
        </div>
      )}

      {liveSiteUrl && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="font-bold text-emerald-900">Website đang kinh doanh thực tế</div>
          <a href={liveSiteUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:underline">
            {hostOf(liveSiteUrl)} <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden />
          </a>
          <p className="mt-1 text-sm leading-relaxed text-emerald-800">Một website thật đang vận hành kinh doanh bằng chính mẫu này.</p>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2 text-sm text-slate-600">
            <i className="fa-solid fa-shield-halved mt-0.5 shrink-0 text-sky-600" aria-hidden />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
