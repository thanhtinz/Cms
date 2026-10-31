import Link from "next/link";
import type { ListParams } from "@/lib/admin-list";
import { pageHref, PAGE_SIZES } from "@/lib/admin-list";

// Thanh bộ lọc dùng chung cho các trang danh sách Admin: tìm kiếm + trạng thái
// + khoảng ngày + số dòng/trang. Là form GET thuần (không cần JS) — bấm Lọc là
// tải lại trang với tham số trên URL, chia sẻ/link lại được.
export function FilterBar({
  base,
  params,
  statusOptions,
  searchPlaceholder = "Tìm kiếm...",
  csvHref,
  csvLabel = "Xuất CSV",
}: {
  base: string;
  params: ListParams;
  statusOptions?: { value: string; label: string }[];
  searchPlaceholder?: string;
  csvHref?: string;
  csvLabel?: string;
}) {
  const hasFilter = params.q || params.status || params.from || params.to;
  return (
    <form method="GET" action={base} className="card mt-4 flex flex-wrap items-end gap-2.5 p-3.5">
      <label className="min-w-[180px] flex-1">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tìm kiếm</span>
        <span className="relative block">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden />
          <input name="q" defaultValue={params.q} placeholder={searchPlaceholder} className="input !pl-8" />
        </span>
      </label>
      {statusOptions && (
        <label className="min-w-[150px]">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trạng thái</span>
          <select name="trangthai" defaultValue={params.status} className="input">
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      )}
      <label className="min-w-[132px]">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Từ ngày</span>
        <input type="date" name="tu" defaultValue={params.from} className="input" />
      </label>
      <label className="min-w-[132px]">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Đến ngày</span>
        <input type="date" name="den" defaultValue={params.to} className="input" />
      </label>
      <label className="w-[104px]">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Số dòng</span>
        <select name="sodong" defaultValue={String(params.size)} className="input">
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s} / trang</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-primary !rounded-xl px-4 py-2.5 text-sm">
        <i className="fa-solid fa-filter mr-1.5" aria-hidden /> Lọc
      </button>
      {hasFilter && (
        <Link href={base} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
          Bỏ lọc
        </Link>
      )}
      {csvHref && (
        <a href={csvHref} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
          <i className="fa-solid fa-file-csv" aria-hidden /> {csvLabel}
        </a>
      )}
    </form>
  );
}

// Phân trang: "Hiển thị X–Y / Z" + nút Trước/Sau + số trang (tối đa 5 số quanh trang hiện tại)
export function Pagination({
  base,
  params,
  page,
  totalPages,
  total,
  from,
  to,
}: {
  base: string;
  params: ListParams;
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
}) {
  if (total === 0) return null;
  const nums: number[] = [];
  const lo = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let i = lo; i <= Math.min(totalPages, lo + 4); i++) nums.push(i);
  const cls = "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition";
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">
        Hiển thị <b className="text-slate-800">{from}–{to}</b> / <b className="text-slate-800">{total}</b> kết quả
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={pageHref(base, params, page - 1)} className={`${cls} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>‹ Trước</Link>
        ) : (
          <span className={`${cls} border-slate-100 bg-slate-50 text-slate-300`}>‹ Trước</span>
        )}
        {nums.map((n) =>
          n === page ? (
            <span key={n} className={`${cls} border-brand-600 bg-brand-600 text-white`}>{n}</span>
          ) : (
            <Link key={n} href={pageHref(base, params, n)} className={`${cls} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>{n}</Link>
          )
        )}
        {page < totalPages ? (
          <Link href={pageHref(base, params, page + 1)} className={`${cls} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>Sau ›</Link>
        ) : (
          <span className={`${cls} border-slate-100 bg-slate-50 text-slate-300`}>Sau ›</span>
        )}
      </span>
    </div>
  );
}
