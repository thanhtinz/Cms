import Link from "next/link";
import { prisma, getSettings } from "@/lib/db";
import TemplateCard from "@/components/TemplateCard";
import PricingSection from "@/components/PricingSection";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "1. Chọn mẫu & gói thuê",
    desc: "Xem demo sống của từng mẫu, chọn gói theo nhu cầu và thời hạn thuê 1–24 tháng (thuê càng dài giảm càng nhiều).",
  },
  {
    title: "2. Nhập tên miền của bạn",
    desc: "Tên miền do bạn sở hữu và quản lý trên Cloudflare. Hệ thống kiểm tra tên miền ngay khi bạn nhập.",
  },
  {
    title: "3. Thanh toán — hệ thống tự tạo web",
    desc: "Ngay khi thanh toán được xác nhận, hệ thống tự tạo website từ mẫu bạn chọn và cấp tên miền tạm để xem trước.",
  },
  {
    title: "4. Trỏ DNS theo hướng dẫn",
    desc: "Trang quản lý hiện đúng 3 bản ghi cần thêm trên Cloudflare kèm nút Kiểm tra lại. Đạt là SSL tự cấp và web lên tên miền thật — hạn thuê bắt đầu tính từ đây.",
  },
];

export default async function HomePage() {
  const [settings, templates, plans, durations, faqs] = await Promise.all([
    getSettings(),
    prisma.template.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sort: "asc" }, { createdAt: "desc" }], take: 6 }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.durationOption.findMany({ orderBy: { sort: "asc" } }),
    prisma.faq.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
  ]);

  return (
    <div>
      {/* HERO — noi dung sua trong Admin > Cai dat */}
      <section className="bg-gradient-to-b from-brand-50 to-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-slate-900 md:text-5xl">{settings.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{settings.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/mau" className="btn-primary px-6 py-3 text-base">{settings.heroCtaText}</Link>
            <Link href="/bang-gia" className="btn-ghost px-6 py-3 text-base">Xem bảng giá</Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
            <span>Tên miền thuộc về bạn 100%</span>
            <span>SSL tự động qua Cloudflare</span>
            <span>Dữ liệu xuất được bất cứ lúc nào</span>
          </div>
        </div>
      </section>

      {/* MAU NOI BAT */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Kho mẫu website</h2>
            <p className="text-slate-500">Mỗi mẫu có demo chạy thật — bấm vào xem trước khi thuê.</p>
          </div>
          <Link href="/mau" className="hidden sm:inline text-sm font-semibold text-brand-700 hover:underline">Xem tất cả mẫu</Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => <TemplateCard key={t.id} t={t} />)}
        </div>
        {templates.length === 0 && <p className="mt-6 text-slate-500">Chưa có mẫu nào được đăng. Vào Admin &gt; Mẫu website để đăng mẫu đầu tiên.</p>}
      </section>

      {/* CACH HOAT DONG */}
      <section id="cach-hoat-dong" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-900">Cách hoạt động</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="font-bold text-slate-900">{s.title}</div>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANG GIA */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900">Gói thuê</h2>
        <p className="mb-6 text-slate-500">Giá và giới hạn từng gói được cấu hình trong trang quản trị.</p>
        <PricingSection plans={plans} durations={durations} />
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">Câu hỏi thường gặp</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.id} className="card p-4">
              <summary className="cursor-pointer font-semibold text-slate-800">{f.question}</summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
