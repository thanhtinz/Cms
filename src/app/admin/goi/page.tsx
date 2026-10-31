import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatVND } from "@/lib/utils";
import { deletePlanAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminPlans({ searchParams }: { searchParams: { loi?: string } }) {
  const plans = await prisma.plan.findMany({ orderBy: [{ sort: "asc" }, { tier: "asc" }] });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gói thuê</h1>
        <Link href="/admin/goi/moi" className="btn-primary">+ Thêm gói</Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">Giá, giới hạn và tính năng từng gói sửa tại đây — luồng thuê trong trang chi tiết mẫu cập nhật theo ngay.</p>
      {searchParams.loi && <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Gói</th><th className="th">Tier</th><th className="th">Giá/tháng</th><th className="th">Dung lượng</th><th className="th">Đang bán</th><th className="th"></th></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="td font-medium">{p.name}{p.highlight && <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-700">Nổi bật</span>}</td>
                <td className="td">{p.tier}</td>
                <td className="td">{formatVND(p.priceMonth)}</td>
                <td className="td">{p.storageGb} GB</td>
                <td className="td">{p.active ? "Có" : "Không"}</td>
                <td className="td whitespace-nowrap">
                  <Link href={`/admin/goi/${p.id}`} className="font-semibold text-brand-700 hover:underline">Sửa</Link>
                  <form action={deletePlanAction} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="ml-3 font-semibold text-red-600 hover:underline">Xoá</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
