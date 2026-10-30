import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, sites: true } } },
  });
  return (
    <div>
      <h1 className="text-2xl font-bold">Khách hàng</h1>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead className="border-b bg-slate-50"><tr><th className="th">Khách</th><th className="th">Liên hệ</th><th className="th">Số đơn thuê</th><th className="th">Số website</th><th className="th">Ngày đăng ký</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="td font-medium">{u.name}</td>
                <td className="td">{u.email}{u.phone ? <div className="text-xs text-slate-400">{u.phone}</div> : null}</td>
                <td className="td">{u._count.orders}</td>
                <td className="td">{u._count.sites}</td>
                <td className="td">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td className="td text-slate-500" colSpan={5}>Chưa có khách nào đăng ký.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
