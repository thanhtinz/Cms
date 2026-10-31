// Tiện ích dùng chung cho các trang danh sách Admin: đọc tham số lọc từ URL
// (q, trangthai, tu, den, trang, sodong), tính phân trang và dựng link giữ bộ lọc.

export type ListParams = {
  q: string;
  status: string;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  page: number;
  size: number;
};

const SIZES = [10, 20, 50, 100];

export function parseListParams(sp: Record<string, string | undefined>): ListParams {
  const sizeRaw = Number(sp.sodong ?? 20);
  return {
    q: (sp.q ?? "").trim(),
    status: (sp.trangthai ?? "").trim(),
    from: (sp.tu ?? "").trim(),
    to: (sp.den ?? "").trim(),
    page: Math.max(1, Number(sp.trang ?? 1) || 1),
    size: SIZES.includes(sizeRaw) ? sizeRaw : 20,
  };
}

// Khoảng ngày cho trường createdAt theo 2 ô lọc Từ ngày / Đến ngày (bao trọn ngày cuối)
export function createdRange(p: ListParams): { gte?: Date; lte?: Date } | undefined {
  const r: { gte?: Date; lte?: Date } = {};
  if (p.from) {
    const d = new Date(`${p.from}T00:00:00`);
    if (!Number.isNaN(d.getTime())) r.gte = d;
  }
  if (p.to) {
    const d = new Date(`${p.to}T23:59:59.999`);
    if (!Number.isNaN(d.getTime())) r.lte = d;
  }
  return r.gte || r.lte ? r : undefined;
}

export function pageInfo(p: ListParams, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / p.size));
  const page = Math.min(p.page, totalPages);
  return {
    page,
    totalPages,
    skip: (page - 1) * p.size,
    from: total === 0 ? 0 : (page - 1) * p.size + 1,
    to: Math.min(total, page * p.size),
  };
}

// Dựng href giữ nguyên bộ lọc hiện tại, chỉ đổi số trang
export function pageHref(base: string, p: ListParams, page: number): string {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.status) qs.set("trangthai", p.status);
  if (p.from) qs.set("tu", p.from);
  if (p.to) qs.set("den", p.to);
  if (p.size !== 20) qs.set("sodong", String(p.size));
  if (page > 1) qs.set("trang", String(page));
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// Query string của bộ lọc hiện tại (cho link xuất CSV giữ đúng điều kiện lọc)
export function filterQuery(p: ListParams): string {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.status) qs.set("trangthai", p.status);
  if (p.from) qs.set("tu", p.from);
  if (p.to) qs.set("den", p.to);
  return qs.toString();
}

export const PAGE_SIZES = SIZES;

// Các biến thể hoa/thường của từ khóa tìm kiếm. Prisma `mode: "insensitive"`
// chỉ chạy trên PostgreSQL (SQLite báo lỗi Unknown argument) nên thay bằng
// cách tra nhiều biến thể — đủ tốt cho tìm mã đơn, email, tên, tên miền.
export function qVariants(q: string): string[] {
  const cap = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
  const all = [q, q.toLowerCase(), q.toUpperCase(), cap];
  return all.filter((v, i) => all.indexOf(v) === i);
}
