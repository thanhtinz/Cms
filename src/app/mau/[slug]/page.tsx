import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { splitLines } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TemplateDetail({ params }: { params: { slug: string } }) {
  const t = await prisma.template.findUnique({ where: { slug: params.slug } });
  if (!t || t.status !== "PUBLISHED") notFound();
  const minPlan = await prisma.plan.findFirst({ where: { tier: t.minPlanTier } });
  const gallery = splitLines(t.gallery);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href="/mau" className="text-sm text-brand-700 hover:underline">← Quay lại kho mẫu</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            {t.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.coverImage} alt={t.name} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-brand-50 text-4xl font-black text-brand-300">{t.name.slice(0, 1)}</div>
            )}
          </div>
          {gallery.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {gallery.map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={g} src={g} alt="" className="card aspect-[16/10] w-full object-cover" />
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{t.category}</span>
            {t.premium && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Premium</span>}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{t.name}</h1>
          <p className="mt-3 leading-relaxed text-slate-600">{t.description}</p>
          <div className="card mt-5 p-4">
            <div className="font-semibold">Mẫu này gồm</div>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              {splitLines(t.features).map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-600">✓</span>{f}</li>)}
            </ul>
            {minPlan && <p className="mt-3 border-t pt-3 text-sm text-slate-500">Gói tối thiểu để dùng mẫu này: <b>{minPlan.name}</b></p>}
          </div>
          <div className="mt-5 flex gap-3">
            {t.demoUrl && <a href={t.demoUrl} target="_blank" rel="noreferrer" className="btn-ghost flex-1 py-3">Xem demo sống</a>}
            <Link href={`/thue?mau=${t.slug}`} className="btn-primary flex-1 py-3">Thuê mẫu này</Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">Sau khi thuê, bạn quản trị nội dung bằng CMS trên chính website của mình: trang, bài viết, sản phẩm, menu, màu sắc…</p>
        </div>
      </div>
    </div>
  );
}
