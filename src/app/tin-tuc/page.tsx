import Link from "next/link";
import { prisma } from "@/lib/db";
import NewsCard from "@/components/NewsCard";

export const dynamic = "force-dynamic";

export default async function NewsListPage({ searchParams }: { searchParams: { muc?: string } }) {
  const all = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });
  const categories = Array.from(new Set(all.map((p) => p.category)));
  const list = searchParams.muc ? all.filter((p) => p.category === searchParams.muc) : all;

  return (
    <div>
      <section className="border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="text-3xl font-black md:text-4xl">Tin tức & hướng dẫn</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Cập nhật tính năng mới, hướng dẫn dùng website thuê và kinh nghiệm bán hàng online — viết bởi đội ngũ nền tảng, quản lý trong Admin &gt; Tin tức.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/tin-tuc" className={`rounded-full px-4 py-1.5 text-sm font-medium ${!searchParams.muc ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"}`}>Tất cả</Link>
            {categories.map((c) => (
              <Link key={c} href={`/tin-tuc?muc=${encodeURIComponent(c)}`} className={`rounded-full px-4 py-1.5 text-sm font-medium ${searchParams.muc === c ? "bg-white text-slate-900" : "bg-white/10 text-white hover:bg-white/20"}`}>{c}</Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => <NewsCard key={p.id} p={p} />)}
        </div>
        {list.length === 0 && <p className="text-slate-500">Chưa có bài viết nào trong mục này.</p>}
      </section>
    </div>
  );
}
