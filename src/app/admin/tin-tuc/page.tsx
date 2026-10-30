import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { deleteNewsAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminNews({ searchParams }: { searchParams: { ok?: string; loi?: string } }) {
  const posts = await prisma.newsPost.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tin tức & bài viết</h1>
          <p className="mt-1 text-sm text-slate-500">Hiển thị ở trang /tin-tuc và mục tin mới trên trang chủ.</p>
        </div>
        <Link href="/admin/tin-tuc/moi" className="btn-primary">+ Viết bài mới</Link>
      </div>
      {searchParams.ok && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchParams.ok}</div>}
      {searchParams.loi && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="th">Bài viết</th><th className="th">Chuyên mục</th><th className="th">Trạng thái</th>
              <th className="th">Ngày tạo</th><th className="th">Thứ tự</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="td">
                  <div className="flex items-center gap-3">
                    {p.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImage} alt="" className="h-10 w-16 rounded object-cover" />
                    )}
                    <div>
                      <Link href={`/admin/tin-tuc/${p.id}`} className="font-semibold text-slate-800 hover:text-brand-700">{p.title}</Link>
                      <div className="text-xs text-slate-400">/tin-tuc/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="td">{p.category}</td>
                <td className="td">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {p.published ? "Đang đăng" : "Nháp"}
                  </span>
                </td>
                <td className="td">{formatDate(p.createdAt)}</td>
                <td className="td">{p.sort}</td>
                <td className="td">
                  <div className="flex items-center gap-3">
                    <Link href={`/tin-tuc/${p.slug}`} target="_blank" className="text-sm text-slate-500 hover:text-brand-700">Xem</Link>
                    <Link href={`/admin/tin-tuc/${p.id}`} className="text-sm font-medium text-brand-700 hover:underline">Sửa</Link>
                    <form action={deleteNewsAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-sm font-medium text-red-600 hover:underline">Xoá</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td className="td py-8 text-center text-slate-500" colSpan={6}>Chưa có bài viết nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
