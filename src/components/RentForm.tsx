"use client";

import { useMemo, useState } from "react";
import type { Template, Plan, DurationOption } from "@prisma/client";
import { formatVND } from "@/lib/utils";
import { createOrderAction } from "@/lib/actions";

interface CheckResult {
  valid: boolean; onCloudflare: boolean; pointsToUs: boolean; used: boolean; messages: string[];
}

export default function RentForm({
  templates, plans, durations, initTemplate, initPlan, error,
}: {
  templates: Template[]; plans: Plan[]; durations: DurationOption[];
  initTemplate?: string; initPlan?: string; error?: string;
}) {
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.slug === initTemplate)?.id ?? templates[0]?.id ?? ""
  );
  const template = templates.find((t) => t.id === templateId);
  const eligiblePlans = plans.filter((p) => p.active && (!template || p.tier >= template.minPlanTier));
  const [planId, setPlanId] = useState(
    eligiblePlans.find((p) => p.slug === initPlan)?.id ?? eligiblePlans[0]?.id ?? ""
  );
  const plan = plans.find((p) => p.id === planId) ?? eligiblePlans[0];
  const [months, setMonths] = useState(12);
  const duration = durations.find((d) => d.months === months) ?? durations[0];
  const [domain, setDomain] = useState("");
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const total = useMemo(() => {
    if (!plan || !duration) return 0;
    return Math.round((plan.priceMonth * duration.months * (100 - duration.discountPercent)) / 100);
  }, [plan, duration]);

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

  return (
    <form action={createOrderAction} className="grid gap-6 lg:grid-cols-5">
      <input type="hidden" name="back" value="/thue" />
      <div className="space-y-6 lg:col-span-3">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="card p-5">
          <h2 className="font-bold">Bước 1 — Chọn mẫu website</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <label key={t.id} className={`cursor-pointer rounded-xl border p-3 ${templateId === t.id ? "border-brand-600 ring-2 ring-brand-100" : "border-slate-200"}`}>
                <input type="radio" name="templateId" value={t.id} className="sr-only" checked={templateId === t.id}
                  onChange={() => { setTemplateId(t.id); const ep = plans.filter((p) => p.active && p.tier >= t.minPlanTier); if (!ep.find((p) => p.id === planId)) setPlanId(ep[0]?.id ?? ""); }} />
                <div className="flex gap-3">
                  {t.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.coverImage} alt="" className="h-14 w-20 rounded-lg object-cover" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.category}{t.premium ? " · Premium" : ""}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Bước 2 — Chọn gói & thời hạn</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {eligiblePlans.map((p) => (
              <label key={p.id} className={`cursor-pointer rounded-xl border p-3 ${plan?.id === p.id ? "border-brand-600 ring-2 ring-brand-100" : "border-slate-200"}`}>
                <input type="radio" name="planId" value={p.id} className="sr-only" checked={plan?.id === p.id} onChange={() => setPlanId(p.id)} />
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-lg font-black">{formatVND(p.priceMonth)}<span className="text-xs font-normal text-slate-500">/tháng</span></div>
                <div className="text-xs text-slate-500">{p.storageGb} GB · {p.cmsUsers} tài khoản quản trị</div>
              </label>
            ))}
          </div>
          {template && plans.filter((p) => p.active && p.tier < template.minPlanTier).length > 0 && (
            <p className="mt-2 text-xs text-slate-400">Một số gói thấp hơn yêu cầu tối thiểu của mẫu này nên không hiển thị.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {durations.filter((d) => d.active).map((d) => (
              <label key={d.id} className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${months === d.months ? "border-brand-600 bg-brand-50 font-semibold text-brand-800" : "border-slate-300"}`}>
                <input type="radio" name="months" value={d.months} className="sr-only" checked={months === d.months} onChange={() => setMonths(d.months)} />
                {d.months} tháng{d.discountPercent > 0 ? ` · −${d.discountPercent}%` : ""}
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Bước 3 — Tên website & tên miền của bạn</h2>
          <label className="label mt-3">Tên website (hiển thị trên web)</label>
          <input name="siteName" required placeholder="Ví dụ: Shop Hoa Tươi An Nhiên" className="input" />
          <label className="label mt-4">Tên miền riêng của bạn</label>
          <div className="flex gap-2">
            <input name="domain" required placeholder="Ví dụ: shopcuaban.vn" className="input" value={domain} onChange={(e) => { setDomain(e.target.value); setCheck(null); }} />
            <button type="button" onClick={runCheck} disabled={checking} className="btn-ghost whitespace-nowrap">{checking ? "Đang kiểm tra..." : "Kiểm tra"}</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Điều kiện bắt buộc: tên miền phải được đưa lên <b>Cloudflare</b> (miễn phí). Bạn giữ toàn quyền sở hữu tên miền —
            hệ thống chỉ hướng dẫn bạn trỏ về nền tảng sau khi web được tạo.
          </p>
          {check && (
            <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${check.valid && !check.used ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
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
        <div className="card sticky top-24 p-5">
          <h2 className="font-bold">Tóm tắt đơn thuê</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Mẫu</dt><dd className="font-medium text-right">{template?.name ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Gói</dt><dd className="font-medium">{plan?.name ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Thời hạn</dt><dd className="font-medium">{duration?.months ?? "—"} tháng</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Đơn giá</dt><dd>{plan ? formatVND(plan.priceMonth) : "—"}/tháng</dd></div>
            {duration && duration.discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600"><dt>Chiết khấu</dt><dd>−{duration.discountPercent}%</dd></div>
            )}
            <div className="flex justify-between border-t pt-3 text-base font-bold"><dt>Tổng thanh toán</dt><dd className="text-brand-700">{formatVND(total)}</dd></div>
          </dl>
          <button className="btn-primary mt-5 w-full py-3">Đặt thuê & tới bước thanh toán</button>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Sau khi đặt, bạn chuyển khoản theo thông tin hiển thị ở bước tiếp theo. Hệ thống tạo web ngay khi thanh toán được xác nhận.
            Chưa có tài khoản? Hệ thống sẽ yêu cầu đăng nhập/đăng ký trước khi tạo đơn.
          </p>
        </div>
      </aside>
    </form>
  );
}
