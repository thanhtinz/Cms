import { prisma } from "@/lib/db";
import RentForm from "@/components/RentForm";

export const dynamic = "force-dynamic";

export default async function RentPage({ searchParams }: { searchParams: { mau?: string; goi?: string; loi?: string } }) {
  const [templates, plans, durations] = await Promise.all([
    prisma.template.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sort: "asc" }] }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.durationOption.findMany({ orderBy: { sort: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Thuê website</h1>
      <p className="mt-1 text-slate-500">3 bước: chọn mẫu — chọn gói & thời hạn — nhập tên miền. Thanh toán xong hệ thống tự tạo web.</p>
      <div className="mt-8">
        <RentForm templates={templates} plans={plans} durations={durations} initTemplate={searchParams.mau} initPlan={searchParams.goi} error={searchParams.loi} />
      </div>
    </div>
  );
}
