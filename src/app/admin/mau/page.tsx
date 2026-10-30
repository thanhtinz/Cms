import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteTemplateAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminTemplates({ searchParams }: { searchParams: { loi?: string } }) {
  const templates = await prisma.template.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }] });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mẫu website</h1>
        <Link href="/admin/mau/moi" className="btn-primary">+ Đăng mẫu mới</Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">Đăng bao nhiêu mẫu tuỳ ý. Mỗi mẫu gắn với một thư mục src trong <b>sites/</b> — khi khách thuê, hệ thống dùng đúng src đó để tạo web.</p>
      {searchParams.loi && <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Mẫu</th><th className="th">Ngành</th><th className="th">Thư mục src</th><th className="th">Gói tối thiểu</th><th className="th">Trạng thái</th><th className="th"></th></tr></thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="td">
                  <div className="font-medium">{t.name} {t.premium && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">Premium</span>}</div>
                  <div className="text-xs text-slate-400">/{t.slug}</div>
                </td>
                <td className="td">{t.category}</td>
                <td className="td font-mono text-xs">{t.folderSlug ? `sites/${t.folderSlug}` : "—"}</td>
                <td className="td">Tier {t.minPlanTier}</td>
                <td className="td">{t.status === "PUBLISHED" ? "Đang đăng" : "Nháp"}</td>
                <td className="td whitespace-nowrap">
                  <Link href={`/admin/mau/${t.id}`} className="font-semibold text-brand-700 hover:underline">Sửa</Link>
                  <form action={deleteTemplateAction} className="inline">
                    <input type="hidden" name="id" value={t.id} />
                    <button className="ml-3 font-semibold text-red-600 hover:underline">Xoá</button>
                  </form>
                </td>
              </tr>
            ))}
            {templates.length === 0 && <tr><td className="td text-slate-500" colSpan={6}>Chưa có mẫu nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
