"use client";

import { useMemo, useState } from "react";
import type { Template, Plan, DurationOption } from "@prisma/client";
import { formatVND, splitLines, limitText } from "@/lib/utils";
import { createOrderAction } from "@/lib/actions";
import { CheckIcon, TicketIcon } from "./icons";

interface CheckResult {
  valid: boolean; onCloudflare: boolean; pointsToUs: boolean; used: boolean; messages: string[];
}

// Form thue ngay trong trang chi tiet mau — mau da co dinh, khach chi chon
// goi + thoi han + voucher + ten mien.
export default function RentForm({
  template, plans, durations, initPlan, error,
}: {
  template: Template; plans: Plan[]; durations: DurationOption[];
  initPlan?: string; error?: string;
}) {
  const eligiblePlans = plans.filter((p) => p.active && p.tier >= template.minPlanTier);
  const lowPlans = plans.filter((p) => p.active && p.tier < template.minPlanTier);
  const [planId, setPlanId] = useState(
    eligiblePlans.find((p) => p.slug === initPlan)?.id ?? eligiblePlans[0]?.id ?? ""
  );
  const plan = eligiblePlans.find((p) => p.id === planId) ?? eligiblePlans[0];
  const [months, setMonths] = useState(12);
  const duration = durations.find((d) => d.months === months && d.active) ?? durations.find((d) => d.active);

  const [domain, setDomain] = useState("");
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherMsg, setVoucherMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applying, setApplying] = useState(false);

  const gross = plan && duration ? plan.priceMonth * duration.months : 0;
  const subtotal = useMemo(() => {
    if (!plan || !duration) return 0;
    return Math.round((plan.priceMonth * duration.months * (100 - duration.discountPercent)) / 100);
  }, [plan, duration]);
  const total = Math.max(0, subtotal - (voucher?.discount ?? 0));

  // Doi goi/thoi han thi so tien thay doi — huy voucher da ap, khach ap lai
  function resetVoucher() {
    if (voucher) setVoucherMsg({ ok: false, text: "Giá đơn đã thay đổi — bấm Áp dụng lại để tính voucher theo giá mới" });
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

      <div className="space-y-6 lg:col-span-3">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">1</span>
            <h2 className="text-lg font-bold text-slate-900">Chọn gói thuê</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {eligiblePlans.map((p) => (
              <label key={p.id} className={`relative cursor-pointer rounded-2xl border-2 p-4 transition ${plan?.id === p.id ? "border-brand-600 bg-brand-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="planId" value={p.id} className="sr-only" checked={plan?.id === p.id}
                  onChange={() => { setPlanId(p.id); resetVoucher(); }} />
                {p.highlight && <span className="absolute -top-2.5 right-3 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">Phổ biến nhất</span>}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${plan?.id === p.id ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-transparent"}`}><CheckIcon className="h-3 w-3" /></span>
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">{formatVND(p.priceMonth)}<span className="text-xs font-medium text-slate-500">/tháng</span></div>
                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  <li>{p.storageGb} GB dung lượng · {limitText(p.productsLimit)} sản phẩm</li>
                  <li>{p.cmsUsers} tài khoản quản trị · {p.ecommerce ? "Có bán hàng online" : "Web giới thiệu"}</li>
                </ul>
              </label>
            ))}
          </div>
          {lowPlans.length > 0 && (
            <p className="mt-3 text-xs text-slate-400">Mẫu này cần gói tối thiểu tier {template.minPlanTier} nên {lowPlans.map((p) => p.name).join(", ")} không dùng được.</p>
          )}

          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-700">Thời hạn thuê</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {durations.filter((d) => d.active).map((d) => (
                <label key={d.id} className={`cursor-pointer rounded-xl border-2 px-4 py-2 text-center transition ${duration?.months === d.months ? "border-brand-600 bg-brand-50 font-semibold text-brand-800" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="months" value={d.months} className="sr-only" checked={duration?.months === d.months}
                    onChange={() => { setMonths(d.months); resetVoucher(); }} />
                  <span className="block text-sm font-bold">{d.months} tháng</span>
                  {d.discountPercent > 0
                    ? <span className="block text-xs font-semibold text-emerald-600">Giảm {d.discountPercent}%</span>
                    : <span className="block text-xs text-slate-400">Giá gốc</span>}
                </label>
              ))}
            </div>
          </div>
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

      <aside className="lg:col-span-2">
        <div className="card sticky top-24 overflow-hidden">
          <div className="bg-slate-900 px-5 py-4 text-white">
            <div className="text-xs uppercase tracking-wide text-slate-400">Đơn thuê của bạn</div>
            <div className="mt-1 font-bold leading-snug">{template.name}</div>
          </div>
          <div className="p-5">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Gói thuê</dt><dd className="font-semibold">{plan?.name ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Thời hạn</dt><dd className="font-semibold">{duration?.months ?? "—"} tháng</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Tạm tính</dt><dd>{formatVND(gross)}</dd></div>
              {duration && duration.discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600"><dt>Chiết khấu thời hạn (−{duration.discountPercent}%)</dt><dd>−{formatVND(gross - subtotal)}</dd></div>
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
            {plan && splitLines(plan.features).length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gói {plan.name} gồm</div>
                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  {splitLines(plan.features).slice(0, 5).map((f) => (
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
