import { prisma } from "@/lib/db";
import TemplateCard from "@/components/TemplateCard";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: { nganh?: string; q?: string } }) {
  const all = await prisma.template.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });
  const categories = Array.from(new Set(all.map((t) => t.category)));
  let list = all;
  if (searchParams.nganh) list = list.filter((t) => t.category === searchParams.nganh);
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    list = list.filter((t) => (t.name + " " + t.description).toLowerCase().includes(q));
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Kho mẫu website</h1>
      <p className="mt-1 text-slate-500">{all.length} mẫu đang cho thuê — tất cả quản lý trong Admin &gt; Mẫu website.</p>
      <form className="mt-6 flex flex-wrap gap-2" action="/mau">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Tìm mẫu: shop, spa, nhà hàng..." className="input max-w-xs" />
        <select name="nganh" defaultValue={searchParams.nganh ?? ""} className="input max-w-[200px]">
          <option value="">Tất cả ngành</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-primary">Lọc</button>
      </form>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => <TemplateCard key={t.id} t={t} />)}
      </div>
      {list.length === 0 && <p className="mt-8 text-slate-500">Không có mẫu nào khớp bộ lọc.</p>}
    </div>
  );
}
