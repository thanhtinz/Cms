import { prisma } from "@/lib/db";
import { minPriceFor } from "@/lib/utils";
import TemplateCard from "@/components/TemplateCard";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: { nganh?: string; q?: string } }) {
  const [all, plans, orderGroups] = await Promise.all([
    prisma.template.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.rentalOrder.groupBy({ by: ["templateId"], where: { status: { not: "DA_HUY" } }, _count: true }),
  ]);
  const rentCount = new Map(orderGroups.map((g) => [g.templateId, g._count]));
  const categories = Array.from(new Set(all.map((t) => t.category)));
  let list = all;
  if (searchParams.nganh) list = list.filter((t) => t.category === searchParams.nganh);
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    list = list.filter((t) => (t.name + " " + t.description + " " + t.features).toLowerCase().includes(q));
  }
  return (
    <div>
      <section className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="text-3xl font-black md:text-4xl">Kho mẫu website</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            {all.length} mẫu đang cho thuê. Bấm vào từng mẫu để xem chi tiết, xem demo và thuê ngay trong trang đó — có chỗ nhập voucher giảm giá.
          </p>
          <form className="mt-6 flex max-w-2xl flex-wrap gap-2" action="/mau">
            <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Tìm mẫu: shop, spa, nhà hàng..." className="min-w-[220px] flex-1 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-brand-400" />
            <select name="nganh" defaultValue={searchParams.nganh ?? ""} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none [&>option]:text-slate-900">
              <option value="">Tất cả ngành</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn-primary px-5 py-2.5">Tìm mẫu</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/mau" className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${!searchParams.nganh ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"}`}>Tất cả</a>
            {categories.map((c) => (
              <a key={c} href={`/mau?nganh=${encodeURIComponent(c)}`} className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${searchParams.nganh === c ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"}`}>{c}</a>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-slate-500">Hiển thị {list.length} mẫu{searchParams.nganh ? ` thuộc ngành ${searchParams.nganh}` : ""}{searchParams.q ? ` khớp “${searchParams.q}”` : ""}</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TemplateCard key={t.id} t={t} minPrice={minPriceFor(t.minPlanTier, plans)} rentCount={rentCount.get(t.id) ?? 0} />
          ))}
        </div>
        {list.length === 0 && (
          <div className="card mt-4 p-8 text-center text-slate-500">
            Không có mẫu nào khớp bộ lọc. <a href="/mau" className="font-semibold text-brand-700 hover:underline">Xem lại tất cả mẫu</a>
          </div>
        )}
      </section>
    </div>
  );
}
