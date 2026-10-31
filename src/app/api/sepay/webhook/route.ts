import { NextRequest, NextResponse } from "next/server";
import { prisma, getSettings } from "@/lib/db";
import { confirmOrderPayment } from "@/lib/confirm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

// ============================================================
// Webhook SePay: SePay goi vao day moi khi tai khoan ngan hang cua
// nen tang phat sinh giao dich. Luong xu ly:
//  1. Xac thuc header Authorization: Apikey <khoa> (khop cau hinh o SePay)
//  2. Chi xu ly giao dich tien VAO (transferType = "in")
//  3. Trich MA DON (TW...) tu truong "code" cua SePay hoac noi dung CK
//  4. So tien >= tong don -> xac nhan thanh toan dung duong dung chung
//     voi admin (confirmOrderPayment): tu tao website / gia han.
// Luon tra 200 sau khi xac thuc xong (ke ca khi khong khop don) de
// SePay khong retry vo han; moi ket qua deu ghi Nhat ky hoat dong.
// ============================================================

type SepayPayload = {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  code?: string | null;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  referenceCode?: string;
};

function extractOrderCode(p: SepayPayload): string | null {
  const codeField = String(p.code ?? "").trim().toUpperCase();
  if (/^TW\d+$/.test(codeField)) return codeField;
  const hay = `${p.content ?? ""} ${p.subAccount ?? ""}`.toUpperCase().replace(/[\s.\-_]/g, "");
  const m = hay.match(/TW\d{3,}/);
  return m ? m[0] : null;
}

export async function POST(req: NextRequest) {
  const settings = await getSettings();
  if (!settings.sepayEnabled) {
    return NextResponse.json({ success: false, message: "SePay chưa được bật trong Admin → Cài đặt" }, { status: 503 });
  }
  if (!settings.sepayApiKey) {
    return NextResponse.json({ success: false, message: "Chưa cấu hình khoá xác thực SePay" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Apikey ${settings.sepayApiKey}`) {
    return NextResponse.json({ success: false, message: "Sai khoá xác thực" }, { status: 401 });
  }

  let p: SepayPayload = {};
  try {
    p = (await req.json()) as SepayPayload;
  } catch {
    return NextResponse.json({ success: false, message: "Body phải là JSON" }, { status: 400 });
  }

  // Chi quan tam tien VAO
  if (p.transferType && p.transferType !== "in") {
    return NextResponse.json({ success: true, message: "Bỏ qua: không phải giao dịch tiền vào" });
  }

  const code = extractOrderCode(p);
  const amount = Number(p.transferAmount ?? 0);
  if (!code) {
    await logActivity("PAYMENT_SEPAY", `SePay báo tiền vào ${amount.toLocaleString("vi-VN")} ₫ nhưng không trích được mã đơn từ nội dung "${String(p.content ?? "").slice(0, 80)}" — admin kiểm tra thủ công`);
    return NextResponse.json({ success: true, message: "Không tìm thấy mã đơn trong nội dung chuyển khoản" });
  }

  const order = await prisma.rentalOrder.findUnique({ where: { code }, select: { id: true, total: true, status: true } });
  if (!order) {
    await logActivity("PAYMENT_SEPAY", `SePay báo tiền vào cho mã ${code} (${amount.toLocaleString("vi-VN")} ₫) nhưng không có đơn nào mang mã này`);
    return NextResponse.json({ success: true, message: `Không có đơn ${code}` });
  }
  if (order.status === "DA_THANH_TOAN") {
    return NextResponse.json({ success: true, message: `Đơn ${code} đã được xác nhận trước đó` });
  }
  if (amount < order.total) {
    await logActivity("PAYMENT_SEPAY", `SePay: đơn ${code} nhận ${amount.toLocaleString("vi-VN")} ₫ — THIẾU so với tổng đơn ${order.total.toLocaleString("vi-VN")} ₫, chưa xác nhận`);
    return NextResponse.json({ success: true, message: `Số tiền chưa đủ cho đơn ${code}` });
  }

  const res = await confirmOrderPayment(order.id, "SEPAY");
  if (!res.ok) {
    // Tien da ve nhung khong xac nhan duoc (vd het dung luong VPS) — ghi log de admin xu ly
    await logActivity("PAYMENT_SEPAY", `SePay: đơn ${code} đã nhận đủ tiền nhưng CHƯA xác nhận được: ${res.reason} — admin xử lý thủ công`);
    return NextResponse.json({ success: true, message: `Chưa xác nhận được đơn ${code}: ${res.reason}` });
  }
  return NextResponse.json({ success: true, message: `Đã xác nhận đơn ${code}` });
}
