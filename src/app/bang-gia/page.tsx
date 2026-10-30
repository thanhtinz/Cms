import { prisma } from "@/lib/db";
import PricingSection from "@/components/PricingSection";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [plans, durations] = await Promise.all([
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.durationOption.findMany({ orderBy: { sort: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Bảng giá thuê website</h1>
      <p className="mt-1 max-w-2xl text-slate-500">
        Tất cả gói đều gồm: tên miền riêng của bạn, SSL tự động, CMS quản trị nội dung, sao lưu định kỳ.
        Giá thuê dài hạn được chiết khấu tự động khi đặt thuê.
      </p>
      <div className="mt-8">
        <PricingSection plans={plans} durations={durations} />
      </div>
    </div>
  );
}
