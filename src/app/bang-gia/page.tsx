import { prisma } from "@/lib/db";
import PricingSection from "@/components/PricingSection";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const packages = await prisma.timePackage.findMany({ where: { active: true }, orderBy: { sort: "asc" } });
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black text-slate-900">Bảng giá thuê website</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        Giá tính theo <b>gói thời gian</b>: chọn một gói, dùng trọn số tháng của gói, thanh toán một lần.
        Không còn cảnh chọn gói rồi nhân tháng cộng chiết khấu — giá bạn thấy là giá bạn trả (trừ thêm voucher nếu có).
      </p>
      <div className="mt-8">
        <PricingSection packages={packages} />
      </div>
    </div>
  );
}
