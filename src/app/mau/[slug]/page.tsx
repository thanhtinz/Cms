import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { splitLines, formatVND, cheapestPackageFor } from "@/lib/utils";
import RentForm from "@/components/RentForm";
import TemplateCard from "@/components/TemplateCard";
import DemoBlock from "@/components/DemoBlock";
import { CheckIcon, PlayIcon, BoltIcon, ShieldIcon, GlobeIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TemplateDetail({
  params, searchParams,
}: {
  params: { slug: string };
  searchParams: { goi?: string; loi?: string };
}) {
  const t = await prisma.template.findUnique({ where: { slug: params.slug } });
  if (!t || t.status !== "PUBLISHED") notFound();

  const [packages, rentCount, related] = await Promise.all([
    prisma.timePackage.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.rentalOrder.count({ where: { templateId: t.id, status: { not: "DA_HUY" } } }),
    prisma.template.findMany({
      where: { status: "PUBLISHED", category: t.category, id: { not: t.id } },
      orderBy: [{ sort: "asc" }],
      take: 3,
    }),
  ]);
  const fromPkg = cheapestPackageFor(t.minPlanTier, packages);
  const gallery = [t.coverImage, ...splitLines(t.gallery)].filter(Boolean) as string[];
  const features = splitLines(t.features);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Trang chủ</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <Link href="/mau" className="hover:text-brand-700">Kho mẫu</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span className="font-medium text-slate-700">{t.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-5">
        {/* Gallery */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            {gallery[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gallery[0]} alt={t.name} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-brand-100 to-slate-200 text-5xl font-black text-brand-300">{t.name.slice(0, 1)}</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {gallery.slice(1, 4).map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={g} src={g} alt="" className="card aspect-[16/10] w-full object-cover" />
              ))}
            </div>
          )}

          {/* Mo ta + tinh nang */}
          <div className="card mt-6 p-6">
            <h2 className="text-lg font-bold text-slate-900">Giới thiệu mẫu này</h2>
            <p className="mt-2 leading-relaxed text-slate-600">{t.description}</p>
            {features.length > 0 && (
              <>
                <h3 className="mt-5 font-bold text-slate-900">Tính năng nổi bật</h3>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckIcon className="h-3 w-3" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-6 grid gap-3 border-t pt-5 sm:grid-cols-3">
              {[
                { icon: <BoltIcon className="h-5 w-5 text-brand-600" />, title: "Tạo web tự động", desc: "Có web trong vài phút sau khi thanh toán được xác nhận" },
                { icon: <GlobeIcon className="h-5 w-5 text-brand-600" />, title: "Tên miền của bạn", desc: "Chạy trên tên miền riêng, SSL tự cấp qua Cloudflare" },
                { icon: <ShieldIcon className="h-5 w-5 text-brand-600" />, title: "CMS đầy đủ", desc: "Tự sửa nội dung, sản phẩm, bài viết — không cần biết code" },
              ].map((x) => (
                <div key={x.title} className="rounded-xl bg-slate-50 p-3">
                  {x.icon}
                  <div className="mt-1.5 text-sm font-bold text-slate-800">{x.title}</div>
                  <div className="text-xs leading-relaxed text-slate-500">{x.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE DEMO — trang khach, admin panel, tai khoan demo, web that */}
          <DemoBlock
            demoUrl={t.demoUrl}
            demoAdminUrl={t.demoAdminUrl}
            demoAccount={t.demoAccount}
            demoPassword={t.demoPassword}
            liveSiteUrl={t.liveSiteUrl}
          />
        </div>

        {/* Thong tin + CTA */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{t.category}</span>
            {t.premium && <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">Premium</span>}
            {rentCount > 0 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Đã có {rentCount} lượt thuê</span>}
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900">{t.name}</h1>

          <div className="card mt-5 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-400">Giá thuê trọn gói chỉ từ</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-700">{fromPkg ? formatVND(fromPkg.price) : "—"}</span>
              {fromPkg && <span className="text-sm text-slate-500">/ {fromPkg.months} tháng</span>}
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              Giá theo gói thời gian — trả một lần cho cả kỳ thuê, thuê càng dài giá quy đổi mỗi tháng càng rẻ. Chọn gói ngay trong form thuê bên dưới.
            </p>
            <div className="mt-4 flex gap-2">
              <a href="#thue-ngay" className="btn-primary flex-1 py-3 text-base shadow-lg shadow-brand-600/20">Thuê mẫu này ngay</a>
              {t.demoUrl && (
                <a href={t.demoUrl} target="_blank" rel="noreferrer" className="btn-ghost py-3"><PlayIcon className="mr-1.5 h-4 w-4" /> Xem demo</a>
              )}
            </div>
            <ul className="mt-4 space-y-1.5 border-t pt-4 text-[13px] text-slate-500">
              {["Không cần biết lập trình — CMS tiếng Việt dễ dùng", "Tên miền thuộc về bạn 100%, xuất dữ liệu bất cứ lúc nào", "Hạn thuê chỉ tính từ ngày web chạy trên tên miền thật"].map((x) => (
                <li key={x} className="flex gap-1.5"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* FORM THUE — ngay trong trang chi tiet */}
      <section id="thue-ngay" className="mt-12 scroll-mt-24">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Thuê mẫu này</h2>
            <p className="mt-1 text-slate-500">Chọn gói, nhập tên miền, thanh toán — hệ thống tự tạo website cho bạn.</p>
          </div>
        </div>
        <RentForm template={t} packages={packages} initPackage={searchParams.goi} error={searchParams.loi} />
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-black text-slate-900">Mẫu cùng ngành {t.category}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <TemplateCard key={r.id} t={r} fromPkg={cheapestPackageFor(r.minPlanTier, packages)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
