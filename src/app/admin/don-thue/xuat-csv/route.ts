import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/utils";
import { parseListParams } from "@/lib/admin-list";
import { orderWhere } from "@/lib/order-filter";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

// Xuất CSV đơn thuê theo ĐÚNG bộ lọc đang áp trên trang danh sách
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Không có quyền truy cập", { status: 403 });
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const p = parseListParams(sp);
  const orders = await prisma.rentalOrder.findMany({
    where: orderWhere(p) as never,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { user: true, template: true },
  });
  const rows = orders.map((o) => [
    o.code,
    o.user.name,
    o.user.email,
    o.template.name,
    o.planName,
    o.durationMonths,
    o.renewalSiteId ? "Gia hạn" : "Thuê mới",
    o.domain,
    o.total,
    ORDER_STATUS[o.status] ?? o.status,
    o.createdAt.toISOString(),
    o.paidAt ? o.paidAt.toISOString() : "",
  ]);
  const csv = toCsv(
    ["Mã đơn", "Khách", "Email", "Mẫu", "Gói", "Số tháng", "Loại đơn", "Tên miền", "Tổng tiền (VND)", "Trạng thái", "Ngày tạo", "Ngày thanh toán"],
    rows
  );
  return csvResponse("don-thue.csv", csv);
}
