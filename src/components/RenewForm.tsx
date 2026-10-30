"use client";

import { useState } from "react";
import type { TimePackage } from "@prisma/client";
import { formatVND, formatDate } from "@/lib/utils";
import { createRenewalAction } from "@/lib/actions";

// Form gia han trong trang chi tiet website: chon 1 goi thoi gian + voucher,
// tao don gia han -> trang thanh toan. Admin xac nhan -> cong them thang.
export default function RenewForm({
  siteId, packages, currentExpiry,
}: {
  siteId: string; packages: TimePackage[]; currentExpiry: string | null;
}) {
  const [pkgId, setPkgId] = useState(packages.find((p) => p.highlight)?.id ?? packages[0]?.id ?? "");
  const pkg = packages.find((p) => p.id === pkgId) ?? packages[0];
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applying, setApplying] = useState(false);

  const subtotal = pkg?.price ?? 0;
  const total = Math.max(0, subtotal - (voucher?.discount ?? 0));

  const now = new Date();
  const exp = currentExpiry ? new Date(currentExpiry) : null;
  const base = exp && exp > now ? exp : now;
  const newExp = pkg ? new Date(base) : null;
  if (newExp && pkg) newExp.setMonth(newExp.getMonth() + pkg.months);

  async function applyVoucher() {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    setMsg(null);
    try {
      const res = await fetch("/api/kiem-tra-voucher", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, amount: subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setVoucher({ code, discount: data.discount });
        setMsg({ ok: true, text: data.message });
      } else {
        setVoucher(null);
        setMsg({ ok: false, text: data.message ?? "Mã không hợp lệ" });
      }
    } finally {
      setApplying(false);
    }
  }

  if (packages.length === 0) return <p className="text-sm text-slate-500">Hiện chưa có gói thời gian nào đang bán để gia hạn.</p>;

  return (
    <form action={createRenewalAction} className="mt-4">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="voucherCode" value={voucher?.code ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <label key={p.id} className={`cursor-pointer rounded-2xl border-2 p-3.5 transition ${pkg?.id === p.id ? "border-brand-600 bg-brand-50/60" : "border-slate-200 hover:border-slate-300"}`}>
            <input type="radio" name="timePackageId" value={p.id} className="sr-only" checked={pkg?.id === p.id}
              onChange={() => { setPkgId(p.id); setVoucher(null); setMsg(null); }} />
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{p.name}</span>
              {p.highlight && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">Phổ biến</span>}
            </div>
            <div className="mt-1 text-lg font-black text-slate-900">{formatVND(p.price)}</div>
            <div className="text-xs text-slate-500">Cộng thêm {p.months} tháng sử dụng</div>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label">Mã voucher (nếu có)</label>
          <div className="flex gap-2">
            <input value={voucherInput} onChange={(e) => setVoucherInput(e.target.value.toUpperCase())} placeholder="VD: WEBSITE10" className="input uppercase" />
            <button type="button" onClick={applyVoucher} disabled={applying} className="btn-ghost whitespace-nowrap">{applying ? "Đang áp..." : "Áp dụng"}</button>
          </div>
          {msg && <p className={`mt-1.5 text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
        </div>
        <dl className="shrink-0 space-y-1 text-sm sm:text-right">
          <div className="flex justify-between gap-6 sm:justify-end"><dt className="text-slate-500">Giá gói</dt><dd>{formatVND(subtotal)}</dd></div>
          {voucher && <div className="flex justify-between gap-6 text-emerald-600 sm:justify-end"><dt>Voucher {voucher.code}</dt><dd>−{formatVND(voucher.discount)}</dd></div>}
          <div className="flex justify-between gap-6 font-bold sm:justify-end"><dt>Tổng</dt><dd className="text-brand-700">{formatVND(total)}</dd></div>
          {newExp && <div className="text-xs text-slate-500">Hết hạn mới (dự kiến): <b className="text-slate-700">{formatDate(newExp)}</b></div>}
        </dl>
      </div>

      <button className="btn-primary mt-4 px-6 py-2.5">
        <i className="fa-solid fa-rotate mr-2" aria-hidden /> Tạo đơn gia hạn & thanh toán
      </button>
      <p className="mt-2 text-xs text-slate-500">Thời gian được cộng khi thanh toán được xác nhận: cộng tiếp từ ngày hết hạn hiện tại nếu website còn hạn, hoặc từ hôm nay nếu đã hết hạn.</p>
    </form>
  );
}
