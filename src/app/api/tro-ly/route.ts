import { NextResponse } from "next/server";
import { prisma, getSettings } from "@/lib/db";
import { formatVND } from "@/lib/utils";
import { describeVoucher } from "@/lib/voucher-shared";

export const runtime = "nodejs";

// Bo dau tieng Viet + thuong hoa de so khop tu khoa
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DEFAULT_SUGS = ["Giá các gói thời gian?", "Tên miền cần gì?", "Thanh toán thế nào?", "Mã voucher đang có"];

export async function POST(req: Request) {
  const { message } = await req.json().catch(() => ({ message: "" }));
  const q = norm(String(message ?? ""));
  if (!q) return NextResponse.json({ answer: "Bạn nhập câu hỏi giúp mình nhé.", suggestions: DEFAULT_SUGS });

  const [settings, packages, faqs, vouchers, templates] = await Promise.all([
    getSettings(),
    prisma.timePackage.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.faq.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.voucher.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.template.findMany({ where: { status: "PUBLISHED" }, select: { name: true, category: true } }),
  ]);

  const has = (...words: string[]) => words.some((w) => q.includes(w));
  let answer: string | null = null;
  let suggestions = DEFAULT_SUGS;

  if (has("voucher", "ma giam", "giam gia", "uu dai", "khuyen mai")) {
    const now = new Date();
    const live = vouchers.filter(
      (v) => (!v.startsAt || v.startsAt <= now) && (!v.expiresAt || v.expiresAt >= now) && (v.usageLimit === 0 || v.usedCount < v.usageLimit)
    );
    answer = live.length
      ? "Các mã ưu đãi đang áp dụng được:\n" +
        live.map((v) => `• ${v.code} — ${describeVoucher(v)}${v.description ? ` (${v.description})` : ""}`).join("\n") +
        "\nCách dùng: nhập mã vào ô Voucher trong form thuê ở trang chi tiết mẫu (hoặc khi gia hạn), hệ thống tự trừ vào tổng tiền."
      : "Hiện chưa có chương trình voucher nào đang chạy. Bạn quay lại sau nhé — mã mới thường xuất hiện ở mục Ưu đãi trên trang chủ.";
    suggestions = ["Giá các gói thời gian?", "Thanh toán thế nào?", "Tên miền cần gì?"];
  } else if (has("gia", "goi", "bao nhieu", "thue", "phi")) {
    answer =
      "Giá thuê tính theo gói thời gian — trả một lần, dùng trọn gói:\n" +
      packages.map((p) => `• ${p.name}: ${formatVND(p.price)} / ${p.months} tháng (~${formatVND(Math.round(p.price / p.months))}/tháng)`).join("\n") +
      "\nMỗi gói có giới hạn riêng (dung lượng, số sản phẩm, tài khoản quản trị). Bạn chọn mẫu trước, rồi chọn gói ngay trong trang chi tiết của mẫu đó.";
    suggestions = ["Mã voucher đang có", "Mẫu nào bán hàng tốt?", "Tên miền cần gì?"];
  } else if (has("ten mien", "domain", "cloudflare", "dns", "ssl", "https")) {
    answer =
      "Tên miền là của riêng bạn và cần được đưa lên Cloudflare (miễn phí) trước khi kết nối. Sau khi thanh toán, mở Dashboard → Website của tôi → chọn website, hệ thống hiện đúng 3 bản ghi cần thêm trên Cloudflare:\n" +
      `• CNAME @ → ${settings.cnameTarget}\n• TXT _cf-custom-hostname → token riêng của website bạn\n• CNAME _acme-challenge → ${settings.acmeTarget} (uỷ quyền cấp SSL tự động)\n` +
      "Thêm xong bấm Kiểm tra lại — khi DNS đạt, admin kích hoạt và hạn thuê mới bắt đầu tính, bạn không mất ngày thuê nào cho khâu chuẩn bị.";
    suggestions = ["Thanh toán thế nào?", "Giá các gói thời gian?", "Gia hạn ra sao?"];
  } else if (has("thanh toan", "chuyen khoan", "vietqr", "quet ma", "tra tien")) {
    answer = settings.bankAccount
      ? `Sau khi đặt thuê, trang thanh toán hiện mã VietQR để quét bằng app ngân hàng. Thông tin chuyển khoản: ngân hàng ${settings.bankCode} — STK ${settings.bankAccount}${settings.bankOwner ? ` — chủ TK ${settings.bankOwner}` : ""}, nội dung chuyển khoản là MÃ ĐƠN của bạn. Admin xác nhận ngay khi tiền về và website được tạo tự động.`
      : "Sau khi đặt thuê, trang hoàn tất đơn sẽ hiện mã VietQR cùng thông tin chuyển khoản và mã đơn. Bạn chuyển khoản đúng số tiền, ghi nội dung là mã đơn — admin xác nhận và hệ thống tự tạo website cho bạn.";
    suggestions = ["Tên miền cần gì?", "Gia hạn ra sao?", "Gặp đội hỗ trợ"];
  } else if (has("gia han", "het han", "sap het", "renew")) {
    answer =
      "Gia hạn rất đơn giản: vào Dashboard → Website của tôi → mở website → mục Gia hạn, chọn gói thời gian và thanh toán như đặt thuê mới. Khi thanh toán được xác nhận, thời gian được cộng tiếp từ ngày hết hạn hiện tại (nếu còn hạn) — không lo bị trừ hao. Nếu website đã hết hạn, hạn mới tính từ hôm nay.";
    suggestions = ["Giá các gói thời gian?", "Mã voucher đang có", "Gặp đội hỗ trợ"];
  } else if (has("mau", "template", "nganh", "ban hang", "shop", "spa", "nha hang")) {
    const cats = Array.from(new Set(templates.map((t) => t.category)));
    answer =
      `Hiện nền tảng có ${templates.length} mẫu đang mở thuê, thuộc các nhóm: ${cats.join(", ")}.\n` +
      "Bạn vào mục Kho mẫu ở trang chủ để xem demo sống của từng mẫu — ưng mẫu nào thì thuê ngay trong trang chi tiết của mẫu đó.";
    suggestions = ["Giá các gói thời gian?", "Tên miền cần gì?", "Mã voucher đang có"];
  } else if (has("ho tro", "lien he", "nguoi that", "ticket", "yeu cau", "gap doi")) {
    answer =
      `Bạn cần người thật hỗ trợ? Gửi yêu cầu tại Dashboard → mục Hỗ trợ (đội hỗ trợ phản hồi ngay trong đó), hoặc liên hệ:\n• Email: ${settings.supportEmail}${settings.supportPhone ? `\n• Điện thoại: ${settings.supportPhone}` : ""}${settings.zaloUrl ? `\n• Zalo: ${settings.zaloUrl}` : ""}`;
    suggestions = ["Giá các gói thời gian?", "Thanh toán thế nào?", "Gia hạn ra sao?"];
  } else {
    // Cham diem FAQ theo do trung tu khoa
    const qTokens = new Set(q.split(" ").filter((w) => w.length > 2));
    let best: { score: number; a: string } | null = null;
    for (const f of faqs) {
      const fTokens = new Set(norm(f.question + " " + f.answer).split(" ").filter((w) => w.length > 2));
      let score = 0;
      qTokens.forEach((t) => { if (fTokens.has(t)) score++; });
      if (!best || score > best.score) best = { score, a: `${f.question}\n${f.answer}` };
    }
    if (best && best.score >= 2) {
      answer = best.a;
      suggestions = DEFAULT_SUGS;
    }
  }

  if (!answer) {
    answer =
      "Câu này mình chưa có dữ kiện để trả lời chắc chắn. Bạn thử hỏi về: giá gói thời gian, tên miền/Cloudflare, thanh toán, voucher hoặc gia hạn.\n" +
      `Cần người thật? Gửi yêu cầu ở Dashboard → Hỗ trợ, hoặc email ${settings.supportEmail}.`;
    suggestions = DEFAULT_SUGS;
  }
  return NextResponse.json({ answer, suggestions });
}
