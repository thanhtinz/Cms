import { prisma, getSettings } from "./db";
import { formatVND, formatDate, ORDER_STATUS, SITE_STATUS } from "./utils";
import { describeVoucher } from "./voucher-shared";

// ============================================================
// Tro ly AI that (theo chuan OpenAI chat/completions — OpenAI,
// OpenRouter... chi can doi Base URL + model trong Admin → Cai dat).
// Nguyen tac: AI chi duoc dung SO LIEU SONG cua nen tang (buildKnowledge)
// — gia, goi, trang thai don/website cua CHINH khach dang dang nhap —
// khong bia. Chua cau hinh key hoac AI loi -> tra null de noi goi
// tu dong lui ve bo tra loi theo quy tac (khong bao gio hong trai nghiem).
// ============================================================

export async function buildKnowledge(userId?: string | null): Promise<string> {
  const [s, packages, faqs, vouchers, templates] = await Promise.all([
    getSettings(),
    prisma.timePackage.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.faq.findMany({ where: { active: true }, orderBy: { sort: "asc" } }),
    prisma.voucher.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.template.findMany({ where: { status: "PUBLISHED" }, select: { name: true, category: true } }),
  ]);
  const now = new Date();
  const liveVouchers = vouchers.filter(
    (v) => (!v.startsAt || v.startsAt <= now) && (!v.expiresAt || v.expiresAt >= now) && (v.usageLimit === 0 || v.usedCount < v.usageLimit)
  );
  const lines: string[] = [
    `Thương hiệu: ${s.brandName}. Email hỗ trợ: ${s.supportEmail}${s.supportPhone ? `, hotline ${s.supportPhone}` : ""}${s.zaloUrl ? `, Zalo: ${s.zaloUrl}` : ""}.`,
    `Chính sách vòng đời: dùng thử ${s.trialDays} ngày, ân hạn sau hết hạn ${s.graceDays} ngày, lưu trữ dữ liệu ${s.archiveDays} ngày sau tạm ngưng.`,
    "GIÁ THUÊ (gói thời gian, trả một lần dùng trọn gói):",
    ...packages.map(
      (p) =>
        `• ${p.name}: ${formatVND(p.price)} / ${p.months} tháng. Hạn mức: ${p.storageGb}GB dung lượng, ${p.bandwidthGb}GB băng thông/tháng, ${p.productsLimit > 0 ? `${p.productsLimit} sản phẩm` : "không giới hạn sản phẩm"}, ${p.cmsUsers} tài khoản quản trị.`
    ),
    `MẪU WEBSITE đang mở thuê (${templates.length} mẫu): ${templates.map((t) => `${t.name} (${t.category})`).join(", ")}.`,
    liveVouchers.length
      ? `VOUCHER đang áp dụng: ${liveVouchers.map((v) => `${v.code} — ${describeVoucher(v)}`).join("; ")}. Cách dùng: nhập mã trong form thuê ở trang chi tiết mẫu hoặc khi gia hạn.`
      : "VOUCHER: hiện không có chương trình nào đang chạy.",
    s.bankAccount
      ? `THANH TOÁN: chuyển khoản VietQR — ngân hàng ${s.bankCode}, STK ${s.bankAccount}${s.bankOwner ? `, chủ TK ${s.bankOwner}` : ""}, nội dung chuyển khoản = MÃ ĐƠN (TW...). Hệ thống tự xác nhận khi tiền về (đối soát tự động SePay nếu đang bật), website được tạo ngay sau đó.`
      : "THANH TOÁN: sau khi đặt thuê, trang hoàn tất đơn hiện mã VietQR và thông tin chuyển khoản; nội dung chuyển khoản = mã đơn.",
    `TÊN MIỀN & DNS: khách dùng tên miền riêng, cần đưa lên Cloudflare (miễn phí). Sau thanh toán, vào Dashboard → Website của tôi → mở website để thấy 3 bản ghi cần thêm: CNAME @ → ${s.cnameTarget}; TXT _cf-custom-hostname → token riêng của từng website; CNAME _acme-challenge → ${s.acmeTarget}. Thêm xong bấm Kiểm tra lại, admin kích hoạt và hạn thuê chỉ bắt đầu tính từ ngày kích hoạt.`,
    "GIA HẠN: Dashboard → Website của tôi → mở website → mục Gia hạn → chọn gói và thanh toán; thời gian cộng tiếp từ ngày hết hạn hiện tại nếu còn hạn, từ hôm nay nếu đã hết hạn.",
    "KEY KÍCH HOẠT: mỗi website có một key riêng (TW-XXXXXX-XXXXXX-XXXXXX) xem trong Dashboard → Website của tôi; ai cũng tra được trạng thái kích hoạt/hạn thuê tại trang Kiểm tra key kích hoạt.",
    ...(faqs.length ? ["CÂU HỎI THƯỜNG GẶP:", ...faqs.map((f) => `Hỏi: ${f.question}\nĐáp: ${f.answer}`)] : []),
  ];

  if (userId) {
    const [user, sites, orders, openTickets] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.site.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.rentalOrder.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.supportTicket.count({ where: { userId, status: { in: ["OPEN", "ANSWERED"] } } }),
    ]);
    if (user) {
      lines.push(`KHÁCH ĐANG HỎI: ${user.name}.`);
      if (sites.length) {
        lines.push(
          "WEBSITE CỦA KHÁCH:",
          ...sites.map(
            (w) =>
              `• ${w.name} (${w.domain}) — trạng thái ${(SITE_STATUS[w.status] ?? SITE_STATUS.HET_HAN).label}${w.expiresAt ? `, hết hạn ${formatDate(w.expiresAt)}` : ", chưa bắt đầu tính hạn (chờ trỏ DNS/kích hoạt)"}${w.licenseKey ? `, key ${w.licenseKey} (${w.keyActivatedAt ? "đã kích hoạt" : "chưa kích hoạt"})` : ""}.`
          )
        );
      }
      if (orders.length) {
        lines.push(
          "ĐƠN THUÊ GẦN NHẤT CỦA KHÁCH:",
          ...orders.map((o) => `• ${o.code} — ${o.planName}, ${formatVND(o.total)}, trạng thái ${ORDER_STATUS[o.status] ?? o.status}, đặt ${formatDate(o.createdAt)}${o.renewalSiteId ? " (đơn gia hạn)" : ""}.`)
        );
      }
      if (openTickets) lines.push(`Khách đang có ${openTickets} yêu cầu hỗ trợ chưa đóng.`);
    }
  }
  return lines.join("\n");
}

// Goi model; tra null neu chua cau hinh hoac co loi (de noi goi tu lui ve quy tac)
export async function callAI(systemPrompt: string, userText: string): Promise<string | null> {
  const s = await getSettings();
  if (!s.aiEnabled || !s.aiApiKey) return null;
  const base = s.aiBaseUrl.replace(/\/+$/, "");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.aiApiKey}` },
      body: JSON.stringify({
        model: s.aiModel,
        temperature: 0.3,
        max_tokens: 900,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) return null;
    const data: any = await res.json().catch(() => null);
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Hoi tro ly (bong bong ho tro): tra null = dung bo quy tac du phong
export async function askAssistant(question: string, userId?: string | null): Promise<string | null> {
  const s = await getSettings();
  if (!s.aiEnabled || !s.aiApiKey) return null;
  const knowledge = await buildKnowledge(userId);
  const system = [
    `Bạn là trợ lý hỗ trợ khách hàng của ${s.brandName} — nền tảng cho thuê website.`,
    "Trả lời bằng tiếng Việt, thân thiện, ngắn gọn, đúng trọng tâm. CHỈ dùng số liệu trong phần DỮ KIỆN bên dưới; không bịa giá, chính sách hay trạng thái không có trong dữ kiện.",
    `Nếu câu hỏi nằm ngoài dữ kiện hoặc cần xử lý riêng cho khách, hãy nói rõ và hướng dẫn khách gửi yêu cầu tại Dashboard → Hỗ trợ hoặc email ${s.supportEmail}.`,
    "Định dạng: văn xuôi thường, xuống dòng khi cần, dùng dấu • cho danh sách; không dùng bảng markdown, không dùng tiêu đề markdown.",
    s.aiPrompt ? `Hướng dẫn thêm từ quản trị viên: ${s.aiPrompt}` : "",
    "=== DỮ KIỆN ===",
    knowledge,
  ]
    .filter(Boolean)
    .join("\n");
  return callAI(system, question);
}

// Soan BAN NHAP tra loi ticket cho admin (admin doc lai roi moi gui)
export async function draftTicketReply(ticketId: string): Promise<{ ok: true; draft: string } | { ok: false; reason: string }> {
  const s = await getSettings();
  if (!s.aiEnabled || !s.aiApiKey) {
    return { ok: false, reason: "Chưa bật AI hoặc chưa có API key — cấu hình tại Admin → Cài đặt, mục Trợ lý AI." };
  }
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return { ok: false, reason: "Không tìm thấy ticket" };
  const knowledge = await buildKnowledge(ticket.userId);
  const convo = ticket.messages.map((m) => `${m.sender === "ADMIN" ? "Đội hỗ trợ" : "Khách"}: ${m.body}`).join("\n");
  const system = [
    `Bạn là nhân viên hỗ trợ giàu kinh nghiệm của ${s.brandName} — nền tảng cho thuê website.`,
    "Nhiệm vụ: SOẠN một câu trả lời hoàn chỉnh để đội hỗ trợ gửi cho khách trong ticket dưới đây. Văn phong lịch sự, rõ ràng, có bước làm cụ thể khi cần; chỉ dùng số liệu trong DỮ KIỆN, không hứa hẹn điều hệ thống không làm được.",
    "Chỉ xuất nội dung câu trả lời (có lời chào và ký tên 'Đội hỗ trợ " + s.brandName + "'), không giải thích gì thêm.",
    "=== DỮ KIỆN ===",
    knowledge,
  ].join("\n");
  const userText = `Ticket: ${ticket.subject}\nKhách: ${ticket.user.name} (${ticket.user.email})\n--- Hội thoại ---\n${convo}`;
  const draft = await callAI(system, userText);
  if (!draft) return { ok: false, reason: "AI không phản hồi — kiểm tra lại API key/model trong Cài đặt hoặc thử lại sau." };
  return { ok: true, draft };
}
