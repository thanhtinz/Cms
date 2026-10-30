import { prisma } from "@/lib/db";
import { saveDurationAction, deleteDurationAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminDurations() {
  const durations = await prisma.durationOption.findMany({ orderBy: { sort: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Thời hạn & chiết khấu</h1>
      <p className="mt-1 text-sm text-slate-500">Khách chọn thời hạn khi thuê — chiết khấu áp tự động vào tổng tiền.</p>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Số tháng</th><th className="th">Giảm %</th><th className="th">Nhãn hiển thị</th><th className="th">Đang bán</th><th className="th"></th></tr></thead>
          <tbody>
            {durations.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="td font-medium">{d.months} tháng</td>
                <td className="td">{d.discountPercent}%</td>
                <td className="td">{d.label ?? "—"}</td>
                <td className="td">{d.active ? "Có" : "Không"}</td>
                <td className="td">
                  <form action={deleteDurationAction} className="inline">
                    <input type="hidden" name="id" value={d.id} />
                    <button className="font-semibold text-red-600 hover:underline">Xoá</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={saveDurationAction} className="card mt-5 grid gap-4 p-5 sm:grid-cols-5">
        <div><label className="label">Số tháng</label><input name="months" type="number" min={1} required className="input" /></div>
        <div><label className="label">Giảm (%)</label><input name="discountPercent" type="number" min={0} max={90} defaultValue={0} className="input" /></div>
        <div><label className="label">Nhãn</label><input name="label" className="input" /></div>
        <div><label className="label">Thứ tự</label><input name="sort" type="number" defaultValue={0} className="input" /></div>
        <div className="flex items-end gap-3 pb-1">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked className="h-4 w-4" /> Đang bán</label>
          <button className="btn-primary">Thêm</button>
        </div>
      </form>
    </div>
  );
}
