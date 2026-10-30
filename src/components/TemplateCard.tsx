import Link from "next/link";
import type { Template } from "@prisma/client";
import { formatVND, splitLines } from "@/lib/utils";
import { PlayIcon } from "./icons";

export default function TemplateCard({
  t, minPrice, rentCount,
}: {
  t: Template; minPrice?: number | null; rentCount?: number;
}) {
  const feats = splitLines(t.features).slice(0, 3);
  return (
    <div className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/mau/${t.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-slate-200">
        {t.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.coverImage} alt={t.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-black text-brand-300">{t.name.slice(0, 1)}</div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{t.category}</span>
          {t.premium && <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-900">Premium</span>}
        </div>
        {rentCount !== undefined && rentCount > 0 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">Đã thuê {rentCount}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/mau/${t.slug}`} className="text-base font-bold leading-snug text-slate-900 hover:text-brand-700">{t.name}</Link>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{t.description}</p>
        {feats.length > 0 && (
          <ul className="mt-3 space-y-1 text-[13px] text-slate-500">
            {feats.map((f) => (
              <li key={f} className="flex gap-1.5">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-end justify-between border-t border-dashed pt-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Thuê chỉ từ</div>
            <div className="text-lg font-black text-brand-700">
              {minPrice ? <>{formatVND(minPrice)}<span className="text-xs font-medium text-slate-400">/tháng</span></> : "Liên hệ"}
            </div>
          </div>
          <div className="flex gap-2">
            {t.demoUrl && (
              <a href={t.demoUrl} target="_blank" rel="noreferrer" className="btn-ghost !px-3" title="Xem demo sống">
                <PlayIcon className="h-4 w-4" /> Demo
              </a>
            )}
            <Link href={`/mau/${t.slug}#thue-ngay`} className="btn-primary !px-3">Thuê ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
