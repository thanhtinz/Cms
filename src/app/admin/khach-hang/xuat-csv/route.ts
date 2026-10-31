import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseListParams } from "@/lib/admin-list";
import { customerWhere } from "@/lib/order-filter";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

// Xuất CSV khách hàng theo ĐÚNG bộ lọc đang áp trên trang danh sách,
// kèm tổng đã chi + số đơn + số website của từng khách
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Không có quyền truy cập", { status: 403 });
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const p = parseListParams(sp);
  const [users, paidGroups] = await Promise.all([
    prisma.user.findMany({
      where: customerWhere(p) as never,
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { _count: { select: { orders: true, sites: true } } },
    }),
    prisma.rentalOrder.groupBy({ by: ["userId"], where: { status: "DA_THANH_TOAN" }, _sum: { total: true } }),
  ]);
  const spentMap = new Map(paidGroups.map((g) => [g.userId, g._sum.total ?? 0]));
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.phone ?? "",
    spentMap.get(u.id) ?? 0,
    u._count.orders,
    u._count.sites,
    u.createdAt.toISOString(),
  ]);
  const csv = toCsv(["Họ tên", "Email", "Số điện thoại", "Tổng đã chi (VND)", "Số đơn thuê", "Số website", "Ngày đăng ký"], rows);
  return csvResponse("khach-hang.csv", csv);
}
