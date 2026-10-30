import Link from "next/link";
import { prisma, getSettings } from "@/lib/db";
import { minPriceFor } from "@/lib/utils";
import TemplateCard from "@/components/TemplateCard";
import PricingSection from "@/components/PricingSection";
import VoucherCard from "@/components/VoucherCard";
import NewsCard from "@/components/NewsCard";
import {
  CheckIcon, BoltIcon, ShieldIcon, GlobeIcon, ServerIcon, ClockIcon, SparkIcon, ArrowRightIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Chọn mẫu & gói thuê",
    desc: "Xem demo sống của từng mẫu ngay trong trang chi tiết, chọn gói theo nhu cầu và thời hạn 1–24 tháng — thuê càng dài giảm càng nhiều.",
  },
  {
    title: "Nhập tên miền của bạn",
    desc: "Tên miền do bạn sở hữu và quản lý trên Cloudflare. Hệ thống kiểm tra tên miền trực tiếp ngay khi bạn nhập.",
  },
  {
    title: "Thanh toán — hệ thống tự tạo web",
    desc: "Ngay khi thanh toán được xác nhận, website được tạo tự động từ mẫu bạn chọn, kèm tên miền tạm để xem trước.",
  },
  {
    title: "Trỏ DNS theo hướng dẫn",
    desc: "Trang quản lý hiện đúng 3 bản ghi cần thêm trên Cloudflare kèm nút kiểm tra lại. SSL tự cấp, hạn thuê bắt đầu tính từ ngày web lên tên miền thật.",
  },
];

const reasons = [
  { icon: <BoltIcon />, title: "Có web trong vài phút", desc: "Toàn bộ khâu dựng web tự động: chọn mẫu, thanh toán xong là web chạy — không chờ đợi, không cần đội kỹ thuật." },
  { icon: <GlobeIcon />, title: "Tên miền & dữ liệu là của bạn", desc: "Tên miền nằm trong tài khoản Cloudflare của bạn. Nội dung website xuất được toàn bộ bất cứ lúc nào." },
  { icon: <ServerIcon />, title: "Không lo server & bảo mật", desc: "Hạ tầng, SSL, sao lưu, cập nhật bảo mật do nền tảng vận hành. Bạn chỉ tập trung bán hàng và làm nội dung." },
  { icon: <ClockIcon />, title: "Thuê linh hoạt theo tháng", desc: "Từ 1 tới 24 tháng, chiết khấu tới 30% khi thuê dài hạn. Hết hạn có ân hạn và giữ dữ liệu thêm 30 ngày." },
];

export default async function HomePage() {
  const now = new Date();
  const [settings, templates, plans, durations, faqs, allVouchers, news, orderGroups, siteCount] = await Promise.all([
    getSettings(),
    prisma.template.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }] }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.durationOption.findMany({ orderBy: { sort: "asc" } }),
    prisma.faq.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.voucher.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.newsPost.findMany({ where: { published: true }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }], take: 3 }),
    prisma.rentalOrder.groupBy({ by: ["templateId"], where: { status: { not: "DA_HUY" } }, _count: true }),
    prisma.site.count(),
  ]);
  const rentCount = new Map(orderGroups.map((g) => [g.templateId, g._count]));
  const vouchers = allVouchers
    .filter((v) => (!v.startsAt || v.startsAt <= now) && (!v.expiresAt || v.expiresAt >= now) && (v.usageLimit === 0 || v.usedCount < v.usageLimit))
    .slice(0, 3);
  const categories = Array.from(new Set(templates.map((t) => t.category)));
  const maxDiscount = Math.max(0, ...durations.filter((d) => d.active).map((d) => d.discountPercent));
  const heroShots = templates.filter((t) => t.coverImage).slice(0, 3);
  const featured = templates.slice(0, 6);

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_10%,rgba(68,76,231,0.35),transparent),radial-gradient(40%_50%_at_10%_90%,rgba(97,114,243,0.25),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 lg:grid-cols-2 lg:items-center lg:pb-20 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">
              <SparkIcon className="h-3.5 w-3.5" /> Nền tảng cho thuê website theo mẫu
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.12] md:text-[3.4rem]">{settings.heroTitle}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-300">{settings.heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/mau" className="btn-primary px-6 py-3 text-base shadow-xl shadow-brand-600/30">
                {settings.heroCtaText} <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Link>
              <Link href="/bang-gia" className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/15">
                Xem bảng giá
              </Link>
            </div>
            <ul className="mt-7 space-y-2 text-sm text-slate-300">
              {["Tên miền thuộc về bạn 100% — SSL tự động qua Cloudflare", "Không cần biết code: CMS tiếng Việt, tự sửa mọi nội dung", "Hủy bất cứ lúc nào, dữ liệu vẫn xuất được đầy đủ"].map((x) => (
                <li key={x} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{x}</li>
              ))}
            </ul>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div><dt className="text-2xl font-black">{templates.length}</dt><dd className="text-xs text-slate-400">Mẫu website</dd></div>
              <div><dt className="text-2xl font-black">{siteCount}</dt><dd className="text-xs text-slate-400">Website đã tạo</dd></div>
              <div><dt className="text-2xl font-black">−{maxDiscount}%</dt><dd className="text-xs text-slate-400">Thuê dài hạn tối đa</dd></div>
            </dl>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative mx-auto max-w-[520px]">
              {heroShots.map((t, i) => (
                <div key={t.id} className={`overflow-hidden rounded-xl border border-white/15 bg-slate-900 shadow-2xl ${i === 0 ? "relative z-10" : i === 1 ? "absolute -bottom-10 -left-10 w-[62%] rotate-[-4deg]" : "absolute -right-8 -top-8 w-[55%] rotate-[5deg]"}`}>
                  <div className="flex items-center gap-1.5 border-b border-white/10 bg-slate-800/80 px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-2 truncate text-[11px] text-slate-400">{t.slug}.{settings.platformDomain}</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.coverImage!} alt={t.name} className="aspect-[16/10] w-full object-cover" />
                </div>
              ))}
              {heroShots.length === 0 && (
                <div className="card flex aspect-[16/10] items-center justify-center bg-slate-900 text-slate-500">Kho mẫu đang được cập nhật</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ DANH MUC NHANH ============ */}
      {categories.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4">
            <span className="mr-1 text-sm font-semibold text-slate-500">Thuê theo ngành:</span>
            {categories.map((c) => (
              <Link key={c} href={`/mau?nganh=${encodeURIComponent(c)}`} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800">
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ MAU NOI BAT ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Kho mẫu website</h2>
            <p className="mt-1 text-slate-500">Mỗi mẫu có trang chi tiết đầy đủ — xem trước, chọn gói và thuê ngay tại đó.</p>
          </div>
          <Link href="/mau" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Xem tất cả {templates.length} mẫu <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TemplateCard key={t.id} t={t} minPrice={minPriceFor(t.minPlanTier, plans)} rentCount={rentCount.get(t.id) ?? 0} />
          ))}
        </div>
        {templates.length === 0 && <p className="mt-6 text-slate-500">Chưa có mẫu nào được đăng. Vào Admin &gt; Mẫu website để đăng mẫu đầu tiên.</p>}
      </section>

      {/* ============ VOUCHER ============ */}
      {vouchers.length > 0 && (
        <section className="border-y border-brand-100 bg-brand-50/50">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Ưu đãi đang chạy</h2>
                <p className="mt-1 text-slate-500">Sao chép mã và nhập ở bước thuê website — giảm trừ trực tiếp vào tổng tiền.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vouchers.map((v) => <VoucherCard key={v.id} v={v} />)}
            </div>
          </div>
        </section>
      )}

      {/* ============ VI SAO CHON ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-3xl font-black text-slate-900">Vì sao thuê web ở đây?</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {reasons.map((r) => (
            <div key={r.title} className="card p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">{r.icon}</span>
              <div className="mt-4 font-bold text-slate-900">{r.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CACH HOAT DONG ============ */}
      <section id="cach-hoat-dong" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-3xl font-black text-slate-900">Cách hoạt động</h2>
          <p className="mt-1 text-slate-500">Bốn bước, phần lớn tự động — bạn chỉ cần chọn mẫu và trỏ tên miền.</p>
          <div className="relative mt-9 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-6 hidden border-t-2 border-dashed border-slate-200 xl:block" />
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-black text-white shadow-lg shadow-brand-600/25">{i + 1}</span>
                <div className="mt-4 font-bold text-slate-900">{s.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BANG GIA ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-slate-900">Gói thuê minh bạch</h2>
          <p className="mt-1 text-slate-500">Giá, giới hạn và chiết khấu theo thời hạn — tất cả cấu hình trong trang quản trị, không phụ phí ẩn.</p>
        </div>
        <div className="mt-7">
          <PricingSection plans={plans} durations={durations} />
        </div>
      </section>

      {/* ============ TIN TUC ============ */}
      {news.length > 0 && (
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Tin tức & hướng dẫn</h2>
                <p className="mt-1 text-slate-500">Cập nhật tính năng và kinh nghiệm vận hành website thuê.</p>
              </div>
              <Link href="/tin-tuc" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                Tất cả bài viết <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((p) => <NewsCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-3xl font-black text-slate-900">Câu hỏi thường gặp</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.id} className="card group p-5">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-800 marker:hidden">
                {f.question}
                <span className="ml-3 shrink-0 text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ CTA CUOI ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 text-center text-white sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(68,76,231,0.4),transparent)]" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              <ShieldIcon className="h-3.5 w-3.5" /> Dùng thử {settings.trialDays} ngày trên tên miền tạm
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-tight">Website của bạn chỉ còn cách vài cú bấm chuột</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-300">Chọn mẫu, nhập tên miền, thanh toán — hệ thống lo phần còn lại.</p>
            <Link href="/mau" className="btn-primary mt-6 px-7 py-3 text-base shadow-xl shadow-brand-600/30">
              Bắt đầu chọn mẫu <ArrowRightIcon className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
