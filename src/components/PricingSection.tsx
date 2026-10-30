import Link from "next/link";
import type { TimePackage } from "@prisma/client";
import { formatVND, splitLines, limitText } from "@/lib/utils";
import { CheckIcon } from "./icons";

// Bang gia theo GOI THOI GIAN — gia tron goi, khong con nhan thang x chiet khau.
export default function PricingSection({ packages }: { packages: TimePackage[] }) {
  const list = packages.filter((p) => p.active);
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <div key={p.id} className={`card relative flex flex-col p-6 ${p.highlight ? "border-brand-500 ring-2 ring-brand-100" : ""}`}>
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white">Được chọn nhiều nhất</span>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900">{p.name}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{p.months} tháng</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{formatVND(p.price)}</span>
              {p.compareAt > p.price && <span className="text-base text-slate-400 line-through">{formatVND(p.compareAt)}</span>}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Trọn gói {p.months} tháng · quy đổi ~{formatVND(Math.round(p.price / p.months))}/tháng
              {p.compareAt > p.price && <span className="ml-1 font-semibold text-emerald-600">tiết kiệm {formatVND(p.compareAt - p.price)}</span>}
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Dung lượng: {p.storageGb} GB · Băng thông: {p.bandwidthGb === -1 ? "Không giới hạn hợp lý" : `${p.bandwidthGb} GB/tháng`}</li>
              <li className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Sản phẩm: {limitText(p.productsLimit)} · Trang: {limitText(p.pagesLimit)}</li>
              <li className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />Tài khoản quản trị CMS: {p.cmsUsers}</li>
              <li className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{p.ecommerce ? "Có bán hàng online" : "Web giới thiệu / doanh nghiệp"}</li>
              {splitLines(p.features).slice(0, 3).map((f) => (
                <li key={f} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{f}</li>
              ))}
            </ul>
            <Link href="/mau" className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-6 w-full py-2.5`}>Chọn mẫu để thuê gói này</Link>
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
        Mọi gói đều gồm tên miền riêng của bạn, SSL tự động qua Cloudflare, CMS tiếng Việt và sao lưu định kỳ.
        Giá thanh toán một lần cho cả kỳ — nhập thêm voucher ở bước thuê để giảm tiếp.
      </p>
    </div>
  );
}
