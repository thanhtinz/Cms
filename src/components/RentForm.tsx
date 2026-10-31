"use client";

import { useState } from "react";
import type { Template, TimePackage } from "@prisma/client";
import { formatVND, splitLines, limitText } from "@/lib/utils";
import { createOrderAction } from "@/lib/actions";
import { CheckIcon, TicketIcon } from "./icons";

interface CheckResult {
  valid: boolean; onCloudflare: boolean; pointsToUs: boolean; used: boolean; messages: string[];
}

// Form thue ngay trong trang chi tiet mau — khach chon 1 GOI THOI GIAN
// (da gom so thang + tong gia), nhap voucher va ten mien.
export default function RentForm({
  template, packages, initPackage, error,
}: {
  template: Template; packages: TimePackage[];
  initPackage?: string; error?: string;
}) {
  const eligible = packages.filter((p) => p.active && p.tier >= template.minPlanTier);
  const low = packages.filter((p) => p.active && p.tier < template.minPlanTier);
  const [pkgId, setPkgId] = useState(
    eligible.find((p) => p.slug === initPackage)?.id ??
    eligible.find((p) => p.highlight)?.id ??
    eligible[0]?.id ?? ""
  );
  const pkg = eligible.find((p) => p.id === pkgId) ?? eligible[0];

  const [domain, setDomain] = useState("");
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applying, setApplying] = useState(false);

  const subtotal = pkg?.price ?? 0;
  const total = Math.max(0, subtotal - (voucher?.discount ?? 0));

  function resetVoucher() {
    if (voucher) setVoucherMsg({ ok: false, text: "Giá đơn đã thay đổi — bấm Áp dụng lại để tính voucher theo gói mới" });
    setVoucher(null);
  }

  async function runCheck() {
    if (!domain.trim()) return;
    setChecking(true);
    setCheck(null);
    try {
      const res = await fetch("/api/kiem-tra-ten-mien", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      setCheck(await res.json());
    } finally {
      setChecking(false);
    }
  }

  async function applyVoucher() {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    setVoucherMsg(null);
    try {
      const res = await fetch("/api/kiem-tra-voucher", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, amount: subtotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setVoucher({ code, discount: data.discount });
        setVoucherMsg({ ok: true, text: data.message });
      } else {
        setVoucher(null);
        setVoucherMsg({ ok: false, text: data.message ?? "Mã không hợp lệ" });
      }
    } finally {
      setApplying(false);
    }
  }

  return (
    <form action={createOrderAction} className="grid gap-6 lg:grid-cols-5">
      <input type="hidden" name="templateId" value={template.id} />
      <input type="hidden" name="back" value={`/mau/${template.slug}`} />
      <input type="hidden" name="voucherCode" value={voucher?.code ?? ""} />

      <div className="min-w-0 space-y-6 lg:col-span-3">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">1</span>
            <h2 className="text-lg font-bold text-slate-900">Chọn gói thời gian</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">Giá đã trọn gói cho cả thời gian thuê — trả một lần, không phát sinh theo tháng.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {eligible.map((p) => (
              <label key={p.id} className={`relative cursor-pointer rounded-2xl border-2 p-4 transition ${pkg?.id === p.id ? "border-brand-600 bg-brand-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="timePackageId" value={p.id} className="sr-only" checked={pkg?.id === p.id}
                  onChange={() => { setPkgId(p.id); resetVoucher(); }} />
                {p.highlight && <span className="absolute -top-2.5 right-3 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">Được chọn nhiều nhất</span>}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pkg?.id === p.id ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-transparent"}`}><CheckIcon className="h-3 w-3" /></span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">{formatVND(p.price)}</span>
                  {p.compareAt > p.price && <span className="text-sm text-slate-400 line-through">{formatVND(p.compareAt)}</span>}
                </div>
                <div className="text-xs text-slate-500">
                  Dùng {p.months} tháng · quy đổi ~{formatVND(Math.round(p.price / p.months))}/tháng
                </div>
                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  <li>{p.storageGb} GB dung lượng · {limitText(p.productsLimit)} sản phẩm · {p.cmsUsers} tài khoản quản trị</li>
                  <li>{p.ecommerce ? "Có bán hàng online" : "Web giới thiệu / doanh nghiệp"}</li>
                </ul>
              </label>
            ))}
          </div>
          {low.length > 0 && (
            <p className="mt-3 text-xs text-slate-400">Mẫu này cần gói từ tier {template.minPlanTier} trở lên nên {low.map((p) => p.name).join(", ")} không dùng được.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">2</span>
            <h2 className="text-lg font-bold text-slate-900">Tên website & tên miền của bạn</h2>
          </div>
          <label className="label mt-4">Tên website (hiển thị trên web)</label>
          <input name="siteName" required placeholder="Ví dụ: Shop Hoa Tươi An Nhiên" className="input" />
          <label className="label mt-4">Tên miền riêng của bạn</label>
          <div className="flex gap-2">
            <input name="domain" required placeholder="Ví dụ: shopcuaban.vn" className="input" value={domain} onChange={(e) => { setDomain(e.target.value); setCheck(null); }} />
            <button type="button" onClick={runCheck} disabled={checking} className="btn-ghost whitespace-nowrap">{checking ? "Đang kiểm tra..." : "Kiểm tra"}</button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Điều kiện bắt buộc: tên miền phải được đưa lên <b>Cloudflare</b> (miễn phí). Bạn giữ toàn quyền sở hữu tên miền —
            sau khi web được tạo, trang quản lý sẽ hướng dẫn bạn thêm đúng 3 bản ghi DNS để kết nối.
          </p>
          {check && (
            <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${check.valid && !check.used ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
              <ul className="list-disc space-y-1 pl-5">
                {check.messages.map((m) => <li key={m}>{m}</li>)}
              </ul>
              {check.valid && !check.used && !check.onCloudflare && (
                <p className="mt-2">Bạn vẫn đặt thuê được — chỉ cần hoàn tất việc đưa tên miền lên Cloudflare trước khi kết nối chính thức.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <aside className="min-w-0 lg:col-span-2">
        <div className="card sticky top-24 overflow-hidden">
          <div className="bg-slate-900 px-5 py-4 text-white">
            <div className="text-xs uppercase tracking-wide text-slate-400">Đơn thuê của bạn</div>
            <div className="mt-1 font-bold leading-snug">{template.name}</div>
          </div>
          <div className="p-5">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Gói thời gian</dt><dd className="font-semibold">{pkg?.name ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Thời gian dùng</dt><dd className="font-semibold">{pkg?.months ?? "—"} tháng</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Giá trọn gói</dt><dd>{formatVND(subtotal)}</dd></div>
              {pkg && pkg.compareAt > pkg.price && (
                <div className="flex justify-between text-emerald-600"><dt>Tiết kiệm so với thuê lẻ</dt><dd>−{formatVND(pkg.compareAt - pkg.price)}</dd></div>
              )}
              {voucher && (
                <div className="flex justify-between text-emerald-600"><dt>Voucher {voucher.code}</dt><dd>−{formatVND(voucher.discount)}</dd></div>
              )}
              <div className="flex items-baseline justify-between border-t pt-3">
                <dt className="font-bold text-slate-900">Tổng thanh toán</dt>
                <dd className="text-xl font-black text-brand-700">{formatVND(total)}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <label className="label flex items-center gap-1.5"><TicketIcon className="h-4 w-4 text-brand-600" /> Mã voucher (nếu có)</label>
              <div className="flex gap-2">
                <input value={voucherInput} onChange={(e) => setVoucherInput(e.target.value.toUpperCase())} placeholder="VD: WEBSITE10" className="input uppercase" />
                <button type="button" onClick={applyVoucher} disabled={applying} className="btn-ghost whitespace-nowrap">{applying ? "Đang áp..." : "Áp dụng"}</button>
              </div>
              {voucherMsg && (
                <p className={`mt-2 text-xs ${voucherMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{voucherMsg.text}</p>
              )}
            </div>

            <button className="btn-primary mt-5 w-full py-3 text-base shadow-lg shadow-brand-600/20">Đặt thuê & thanh toán</button>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              {["Web được tạo tự động ngay khi thanh toán được xác nhận", "Hạn thuê chỉ tính từ ngày tên miền chính thức hoạt động", "Xuất toàn bộ dữ liệu bất cứ lúc nào — web là của bạn"].map((x) => (
                <li key={x} className="flex gap-1.5"><CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{x}</li>
              ))}
            </ul>
            {pkg && splitLines(pkg.features).length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{pkg.name} gồm</div>
                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  {splitLines(pkg.features).slice(0, 5).map((f) => (
                    <li key={f} className="flex gap-1.5"><CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}
