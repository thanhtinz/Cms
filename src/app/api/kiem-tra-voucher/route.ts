import { NextRequest, NextResponse } from "next/server";
import { checkVoucher } from "@/lib/voucher";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Kiem tra voucher truc tiep khi khach nhap ma o form thue.
// Body: { code, amount } — amount la so tien sau chiet khau thoi han.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Đăng nhập để dùng voucher" });
  }
  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "");
  const amount = Number(body?.amount ?? 0);
  if (!code || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, message: "Thiếu mã voucher hoặc số tiền đơn" });
  }
  const r = await checkVoucher(code, amount);
  if (!r.ok) return NextResponse.json({ ok: false, message: r.message });
  return NextResponse.json({ ok: true, discount: r.discount, message: `Áp dụng thành công — giảm ${r.discount.toLocaleString("vi-VN")} ₫` });
}
