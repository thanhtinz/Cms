import { prisma } from "./db";

// Kiem tra voucher tren tong gia goi thoi gian.
// Tra ve so tien duoc giam neu hop le, hoac thong bao loi de hien cho khach.
export async function checkVoucher(rawCode: string, amount: number) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false as const, message: "Vui lòng nhập mã voucher" };
  const v = await prisma.voucher.findUnique({ where: { code } });
  if (!v || !v.active) return { ok: false as const, message: "Mã voucher không tồn tại hoặc đã tắt" };
  const now = new Date();
  if (v.startsAt && now < v.startsAt) return { ok: false as const, message: "Mã voucher chưa tới ngày áp dụng" };
  if (v.expiresAt && now > v.expiresAt) return { ok: false as const, message: "Mã voucher đã hết hạn" };
  if (v.usageLimit > 0 && v.usedCount >= v.usageLimit) return { ok: false as const, message: "Mã voucher đã hết lượt sử dụng" };
  if (amount < v.minTotal) {
    return { ok: false as const, message: `Mã này áp dụng cho đơn từ ${v.minTotal.toLocaleString("vi-VN")} ₫ trở lên` };
  }
  let discount =
    v.type === "PERCENT" ? Math.floor((amount * v.value) / 100) : v.value;
  if (v.type === "PERCENT" && v.maxDiscount > 0) discount = Math.min(discount, v.maxDiscount);
  discount = Math.min(discount, amount);
  if (discount <= 0) return { ok: false as const, message: "Mã voucher không giảm thêm cho đơn này" };
  return { ok: true as const, voucher: v, discount };
}

