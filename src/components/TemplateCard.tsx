import Link from "next/link";
import type { Template } from "@prisma/client";

export default function TemplateCard({ t }: { t: Template }) {
  return (
    <div className="card overflow-hidden flex flex-col">
      <Link href={`/mau/${t.slug}`} className="block aspect-[16/10] bg-gradient-to-br from-brand-100 to-slate-200 overflow-hidden">
        {t.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.coverImage} alt={t.name} className="h-full w-full object-cover hover:scale-105 transition duration-300" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-black text-brand-300">{t.name.slice(0, 1)}</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{t.category}</span>
          {t.premium && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Premium</span>}
        </div>
        <Link href={`/mau/${t.slug}`} className="mt-2 font-semibold text-slate-900 hover:text-brand-700">{t.name}</Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.description}</p>
        <div className="mt-4 flex gap-2 pt-1 mt-auto">
          {t.demoUrl ? (
            <a href={t.demoUrl} target="_blank" rel="noreferrer" className="btn-ghost flex-1">Xem demo</a>
          ) : (
            <Link href={`/mau/${t.slug}`} className="btn-ghost flex-1">Xem chi tiết</Link>
          )}
          <Link href={`/thue?mau=${t.slug}`} className="btn-primary flex-1">Thuê mẫu này</Link>
        </div>
      </div>
    </div>
  );
}
