import Link from "next/link";
import type { NewsPost } from "@prisma/client";
import { formatDate } from "@/lib/utils";

export default function NewsCard({ p }: { p: NewsPost }) {
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/tin-tuc/${p.slug}`} className="block aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
        {p.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-lg font-black text-white/70">{p.title}</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{p.category}</span>
          <span className="text-slate-400">{formatDate(p.createdAt)}</span>
        </div>
        <Link href={`/tin-tuc/${p.slug}`} className="mt-2 font-bold leading-snug text-slate-900 hover:text-brand-700">
          {p.title}
        </Link>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-500">{p.excerpt}</p>
        <Link href={`/tin-tuc/${p.slug}`} className="mt-auto pt-3 text-sm font-semibold text-brand-700 hover:underline">
          Đọc tiếp →
        </Link>
      </div>
    </article>
  );
}
