// Mo ta voucher — dung chung cho ca server va client components
// (tach khoi lib/voucher.ts vi file do import Prisma, khong vao client bundle duoc).
export function describeVoucher(v: {
  type: string; value: number; maxDiscount: number; minTotal: number;
}): string {
  const parts: string[] = [];
  if (v.type === "PERCENT") {
    parts.push(`Giảm ${v.value}%`);
    if (v.maxDiscount > 0) parts.push(`tối đa ${v.maxDiscount.toLocaleString("vi-VN")} ₫`);
  } else {
    parts.push(`Giảm thẳng ${v.value.toLocaleString("vi-VN")} ₫`);
  }
  if (v.minTotal > 0) parts.push(`cho đơn từ ${v.minTotal.toLocaleString("vi-VN")} ₫`);
  return parts.join(", ");
}
