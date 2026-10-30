import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveNewsAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminNewsEdit({
  params, searchParams,
}: {
  params: { id: string };
  searchParams: { loi?: string };
}) {
  const isNew = params.id === "moi";
  const p = isNew ? null : await prisma.newsPost.findUnique({ where: { id: params.id } });
  if (!isNew && !p) notFound();
  return (
    <div>
      <Link href="/admin/tin-tuc" className="text-sm text-brand-700 hover:underline">← Danh sách bài viết</Link>
      <h1 className="mt-2 text-2xl font-bold">{isNew ? "Viết bài mới" : `Sửa bài: ${p!.title}`}</h1>
      {searchParams.loi && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}
      <form action={saveNewsAction} className="card mt-5 space-y-4 p-6">
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <div><label className="label">Tiêu đề *</label><input name="title" required defaultValue={p?.title ?? ""} className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Slug (để trống = tự sinh từ tiêu đề)</label><input name="slug" defaultValue={p?.slug ?? ""} className="input" /></div>
          <div><label className="label">Chuyên mục</label><input name="category" defaultValue={p?.category ?? "Tin tức"} placeholder="Tin tức / Hướng dẫn / Kinh nghiệm" className="input" /></div>
          <div><label className="label">Ảnh bìa (URL)</label><input name="coverImage" defaultValue={p?.coverImage ?? ""} className="input" /></div>
          <div><label className="label">Thứ tự hiển thị</label><input name="sort" type="number" defaultValue={p?.sort ?? 0} className="input" /></div>
        </div>
        <div>
          <label className="label">Tóm tắt ngắn (hiện ở thẻ bài viết)</label>
          <textarea name="excerpt" rows={2} defaultValue={p?.excerpt ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Nội dung bài viết</label>
          <textarea name="content" rows={14} defaultValue={p?.content ?? ""} className="input leading-relaxed" />
          <p className="mt-1 text-xs text-slate-400">Mỗi đoạn văn cách nhau bằng một dòng trống — trang bài viết sẽ tự tách đoạn.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p?.published ?? true} className="h-4 w-4" /> Đăng ngay</label>
          <button className="btn-primary">{isNew ? "Đăng bài" : "Lưu thay đổi"}</button>
        </div>
      </form>
    </div>
  );
}
