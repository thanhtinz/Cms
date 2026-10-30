import Link from "next/link";
import type { Plan, DurationOption } from "@prisma/client";
import { formatVND, splitLines, limitText } from "@/lib/utils";

export default function PricingSection({ plans, durations }: { plans: Plan[]; durations: DurationOption[] }) {
  const year = durations.find((d) => d.months === 12);
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.filter((p) => p.active).map((p) => (
          <div key={p.id} className={`card relative flex flex-col p-5 ${p.highlight ? "border-brand-500 ring-2 ring-brand-100" : ""}`}>
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white">Phổ biến nhất</span>
            )}
            <div className="font-bold text-lg">{p.name}</div>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900">{formatVND(p.priceMonth)}</span>
              <span className="text-sm text-slate-500"> /tháng</span>
            </div>
            {year && year.discountPercent > 0 && (
              <div className="mt-1 text-xs text-emerald-600">
                Thuê 12 tháng giảm {year.discountPercent}%: chỉ {formatVND(Math.round((p.priceMonth * 12 * (100 - year.discountPercent)) / 100))}
              </div>
            )}
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>Dung lượng: {p.storageGb} GB</li>
              <li>Băng thông: {p.bandwidthGb === -1 ? "Không giới hạn hợp lý" : `${p.bandwidthGb} GB/tháng`}</li>
              <li>Số trang: {limitText(p.pagesLimit)}</li>
              <li>Sản phẩm: {limitText(p.productsLimit)}</li>
              <li>Tài khoản quản trị: {p.cmsUsers}</li>
              {splitLines(p.features).slice(3).map((f) => <li key={f}>{f}</li>)}
            </ul>
            <Link href="/mau" className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-5 mt-auto w-full`}>Chọn mẫu để thuê</Link>
          </div>
        ))}
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead className="border-b bg-slate-50">
            <tr><th className="th">Thời hạn thuê</th><th className="th">Chiết khấu</th><th className="th">Ghi chú</th></tr>
          </thead>
          <tbody>
            {durations.filter((d) => d.active).map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="td font-medium">{d.months} tháng</td>
                <td className="td">{d.discountPercent > 0 ? `Giảm ${d.discountPercent}%` : "Giá gốc"}</td>
                <td className="td text-slate-500">{d.label ?? (d.months >= 12 ? "Tiết kiệm nhất cho kinh doanh lâu dài" : "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
