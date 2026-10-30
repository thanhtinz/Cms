export function formatVND(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function splitLines(s: string | null | undefined): string[] {
  return (s ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
}

// Goi thoi gian re nhat dung duoc cho 1 mau (du tier yeu cau)
export function cheapestPackageFor(
  minTier: number,
  packages: { tier: number; price: number; months: number; active: boolean }[]
): { price: number; months: number } | null {
  const ok = packages.filter((p) => p.active && p.tier >= minTier);
  if (ok.length === 0) return null;
  const best = ok.reduce((a, b) => (b.price < a.price ? b : a));
  return { price: best.price, months: best.months };
}

export function limitText(n: number): string {
  return n === -1 ? "Không giới hạn" : String(n);
}

export const ORDER_STATUS: Record<string, string> = {
  CHO_THANH_TOAN: "Chờ thanh toán",
  DA_THANH_TOAN: "Đã thanh toán",
  DA_HUY: "Đã huỷ",
};

export const TICKET_STATUS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Chờ phản hồi", color: "bg-amber-100 text-amber-700" },
  ANSWERED: { label: "Đã phản hồi", color: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Đã đóng", color: "bg-slate-200 text-slate-600" },
};

export const SITE_STATUS: Record<string, { label: string; color: string }> = {
  CHO_TRO_DNS: { label: "Chờ trỏ tên miền", color: "bg-amber-100 text-amber-800" },
  DANG_HOAT_DONG: { label: "Đang hoạt động", color: "bg-emerald-100 text-emerald-800" },
  TAM_NGUNG: { label: "Tạm ngưng", color: "bg-red-100 text-red-800" },
  HET_HAN: { label: "Hết hạn", color: "bg-slate-200 text-slate-700" },
};
