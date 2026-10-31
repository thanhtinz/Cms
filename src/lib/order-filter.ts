import { createdRange, qVariants, type ListParams } from "./admin-list";

// Điều kiện lọc dùng chung: trang danh sách Admin và file xuất CSV phải luôn
// khớp nhau (lọc gì trên màn hình thì xuất đúng như vậy). Tìm kiếm không dùng
// mode:"insensitive" (SQLite không hỗ trợ) — thay bằng các biến thể hoa/thường.

export function orderWhere(p: ListParams) {
  const where: Record<string, unknown> = {};
  if (p.status) where.status = p.status;
  const range = createdRange(p);
  if (range) where.createdAt = range;
  if (p.q) {
    const vs = qVariants(p.q);
    where.OR = [
      ...vs.map((v) => ({ code: { contains: v } })),
      ...vs.map((v) => ({ domain: { contains: v } })),
      ...vs.map((v) => ({ siteName: { contains: v } })),
      ...vs.map((v) => ({ user: { name: { contains: v } } })),
      ...vs.map((v) => ({ user: { email: { contains: v } } })),
    ];
  }
  return where;
}

// Điều kiện lọc website khách (danh sách Admin)
export function siteWhere(p: ListParams) {
  const where: Record<string, unknown> = {};
  if (p.status) where.status = p.status;
  const range = createdRange(p);
  if (range) where.createdAt = range;
  if (p.q) {
    const vs = qVariants(p.q);
    where.OR = [
      ...vs.map((v) => ({ name: { contains: v } })),
      ...vs.map((v) => ({ domain: { contains: v } })),
      ...vs.map((v) => ({ slug: { contains: v } })),
      ...vs.map((v) => ({ licenseKey: { contains: v } })),
      ...vs.map((v) => ({ user: { name: { contains: v } } })),
      ...vs.map((v) => ({ user: { email: { contains: v } } })),
    ];
  }
  return where;
}

// Điều kiện lọc khách hàng (danh sách Admin + xuất CSV)
export function customerWhere(p: ListParams) {
  const where: Record<string, unknown> = { role: "CUSTOMER" };
  const range = createdRange(p);
  if (range) where.createdAt = range;
  if (p.q) {
    const vs = qVariants(p.q);
    where.OR = [
      ...vs.map((v) => ({ name: { contains: v } })),
      ...vs.map((v) => ({ email: { contains: v } })),
      ...vs.map((v) => ({ phone: { contains: v } })),
    ];
  }
  return where;
}
