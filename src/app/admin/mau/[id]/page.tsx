import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveTemplateAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminTemplateEdit({ params }: { params: { id: string } }) {
  const isNew = params.id === "moi";
  const t = isNew ? null : await prisma.template.findUnique({ where: { id: params.id } });
  if (!isNew && !t) notFound();
  const pkgs = await prisma.timePackage.findMany({ orderBy: { tier: "asc" } });
  const tiers = Array.from(new Map(pkgs.map((p) => [p.tier, p.name])).entries());
  return (
    <div>
      <Link href="/admin/mau" className="text-sm text-brand-700 hover:underline">← Danh sách mẫu</Link>
      <h1 className="mt-2 text-2xl font-bold">{isNew ? "Đăng mẫu mới" : `Sửa mẫu: ${t!.name}`}</h1>
      <form action={saveTemplateAction} className="card mt-5 space-y-4 p-6">
        <input type="hidden" name="id" value={t?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Tên mẫu *</label><input name="name" required defaultValue={t?.name ?? ""} className="input" /></div>
          <div><label className="label">Slug (để trống = tự sinh từ tên)</label><input name="slug" defaultValue={t?.slug ?? ""} className="input" /></div>
          <div><label className="label">Ngành nghề</label><input name="category" defaultValue={t?.category ?? ""} placeholder="Bán hàng / Doanh nghiệp / Spa..." className="input" /></div>
          <div><label className="label">Thư mục src trong sites/</label><input name="folderSlug" defaultValue={t?.folderSlug ?? ""} placeholder="vd: shop-thoi-trang" className="input" /></div>
          <div><label className="label">Ảnh bìa (URL)</label><input name="coverImage" defaultValue={t?.coverImage ?? ""} className="input" /></div>
          <div><label className="label">Link demo sống — Trang khách (URL)</label><input name="demoUrl" defaultValue={t?.demoUrl ?? ""} className="input" /></div>
          <div><label className="label">Link demo — Admin Panel (URL)</label><input name="demoAdminUrl" defaultValue={t?.demoAdminUrl ?? ""} placeholder="https://demo.../admin" className="input" /></div>
          <div><label className="label">Tài khoản đăng nhập demo (hiện công khai)</label><input name="demoAccount" defaultValue={t?.demoAccount ?? ""} placeholder="vd: admin@demo.vn" className="input" /></div>
          <div><label className="label">Mật khẩu đăng nhập demo (hiện công khai)</label><input name="demoPassword" defaultValue={t?.demoPassword ?? ""} placeholder="Mật khẩu của tài khoản demo chuyên cho khách xem" className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Website thật đang kinh doanh bằng mẫu này (URL, hiện ở khối Live demo)</label><input name="liveSiteUrl" defaultValue={t?.liveSiteUrl ?? ""} placeholder="https://shop-that.vn" className="input" /></div>
          <div>
            <label className="label">Tier gói thời gian tối thiểu được dùng mẫu</label>
            <select name="minPlanTier" defaultValue={t?.minPlanTier ?? 1} className="input">
              {tiers.map(([tier, name]) => <option key={tier} value={tier}>Tier {tier} (từ {name})</option>)}
              {tiers.length === 0 && <option value={1}>Tier 1</option>}
            </select>
          </div>
          <div>
            <label className="label">Trạng thái</label>
            <select name="status" defaultValue={t?.status ?? "PUBLISHED"} className="input">
              <option value="PUBLISHED">Đang đăng (khách thấy)</option>
              <option value="DRAFT">Nháp (chỉ admin thấy)</option>
            </select>
          </div>
          <div><label className="label">Thứ tự hiển thị</label><input name="sort" type="number" defaultValue={t?.sort ?? 0} className="input" /></div>
          <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" name="premium" defaultChecked={t?.premium} className="h-4 w-4" /> Mẫu Premium</label>
        </div>
        <div><label className="label">Mô tả</label><textarea name="description" rows={3} defaultValue={t?.description ?? ""} className="input" /></div>
        <div><label className="label">Tính năng của mẫu (mỗi dòng 1 tính năng)</label><textarea name="features" rows={4} defaultValue={t?.features ?? ""} className="input" /></div>
        <div><label className="label">Ảnh thư viện (mỗi dòng 1 URL ảnh)</label><textarea name="gallery" rows={3} defaultValue={t?.gallery ?? ""} className="input" /></div>
        <button className="btn-primary px-6 py-2.5">{isNew ? "Đăng mẫu" : "Lưu thay đổi"}</button>
      </form>
    </div>
  );
}
