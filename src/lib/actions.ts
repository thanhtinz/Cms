"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { prisma, getSettings, bustSettingsCache } from "./db";
import { createSession, destroySession, hashPassword, verifyPassword, requireAdmin, getCurrentUser } from "./auth";
import { slugify, splitLines } from "./utils";
import { normalizeDomain } from "./domain";
import { checkVoucher } from "./voucher";
import { quotaFromPackage, canAllocate } from "./quota";
import { generateUniqueLicenseKey } from "./license";
import { logActivity } from "./activity";

// ---------- AUTH ----------
export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!email || !password || !name) redirect("/dang-ky?loi=" + encodeURIComponent("Vui lòng nhập đủ họ tên, email và mật khẩu"));
  if (password.length < 6) redirect("/dang-ky?loi=" + encodeURIComponent("Mật khẩu tối thiểu 6 ký tự"));
  const existed = await prisma.user.findUnique({ where: { email } });
  if (existed) redirect("/dang-ky?loi=" + encodeURIComponent("Email này đã có tài khoản, hãy đăng nhập"));
  const user = await prisma.user.create({
    data: { email, name, phone: phone || null, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect(`/portal?tb=${encodeURIComponent(`Đăng ký thành công — chào mừng ${name} đến với nền tảng!`)}`);
}

function withFlash(path: string, msg: string) {
  return `${path}${path.includes("?") ? "&" : "?"}tb=${encodeURIComponent(msg)}`;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const tieptuc = String(formData.get("tieptuc") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const back = tieptuc ? `&tieptuc=${encodeURIComponent(tieptuc)}` : "";
    redirect(`/dang-nhap?loi=${encodeURIComponent("Email hoặc mật khẩu không đúng — kiểm tra lại rồi thử lại nhé")}${back}`);
  }
  await createSession(user.id);
  const target = user.role === "ADMIN" ? "/admin" : tieptuc || "/portal";
  redirect(withFlash(target, `Đăng nhập thành công — chào ${user.name}!`));
}

export async function logoutAction() {
  await destroySession();
  redirect(`/?tb=${encodeURIComponent("Đã đăng xuất — hẹn gặp lại bạn!")}`);
}

// ---------- DON THUE (khach) ----------
function genOrderCode() {
  return "TW" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
}

export async function createOrderAction(formData: FormData) {
  const user = await getCurrentUser();
  const templateId = String(formData.get("templateId") ?? "");
  const timePackageId = String(formData.get("timePackageId") ?? "");
  const siteName = String(formData.get("siteName") ?? "").trim();
  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  const voucherCode = String(formData.get("voucherCode") ?? "").trim();
  const back = String(formData.get("back") ?? "/mau");

  if (!user) redirect(`/dang-nhap?tieptuc=${encodeURIComponent(back)}`);
  const [template, pkg] = await Promise.all([
    prisma.template.findUnique({ where: { id: templateId } }),
    prisma.timePackage.findUnique({ where: { id: timePackageId } }),
  ]);
  if (!template || template.status !== "PUBLISHED") redirect(`${back}?loi=${encodeURIComponent(`Mẫu website không hợp lệ`)}`);
  if (!pkg || !pkg.active) redirect(`${back}?loi=${encodeURIComponent(`Gói thời gian không hợp lệ`)}`);
  if (pkg.tier < template.minPlanTier) redirect(`${back}?loi=${encodeURIComponent(`Mẫu này cần gói thời gian từ tier ${template.minPlanTier} trở lên`)}`);
  if (!siteName) redirect(`${back}?loi=${encodeURIComponent(`Vui lòng nhập tên website`)}`);
  if (!domain) redirect(`${back}?loi=${encodeURIComponent(`Vui lòng nhập tên miền của bạn`)}`);

  const dup = await prisma.site.findFirst({ where: { domain } });
  const dupOrder = await prisma.rentalOrder.findFirst({ where: { domain, status: { not: "DA_HUY" } } });
  if (dup || dupOrder) redirect(`${back}?loi=${encodeURIComponent(`Tên miền này đã được dùng trong hệ thống`)}`);

  // Gia theo goi thoi gian: tong tron goi, khong nhan thang x chiet khau nua
  const subtotal = pkg.price;

  // Voucher: server tu kiem tra lai (khong tin so client gui len)
  let voucherId: string | null = null;
  let voucherCodeSaved: string | null = null;
  let voucherDiscount = 0;
  if (voucherCode) {
    const r = await checkVoucher(voucherCode, subtotal);
    if (!r.ok) redirect(`${back}?loi=${encodeURIComponent("Voucher: " + r.message)}`);
    voucherId = r.voucher.id;
    voucherCodeSaved = r.voucher.code;
    voucherDiscount = r.discount;
  }
  const total = subtotal - voucherDiscount;

  const order = await prisma.rentalOrder.create({
    data: {
      code: genOrderCode(),
      userId: user.id,
      templateId: template.id,
      timePackageId: pkg.id,
      planName: pkg.name,
      planPriceMonth: Math.round(pkg.price / pkg.months),
      durationMonths: pkg.months,
      discountPercent: 0,
      subtotal,
      voucherId,
      voucherCode: voucherCodeSaved,
      voucherDiscount,
      total,
      siteName,
      domain,
    },
  });
  if (voucherId) {
    await prisma.voucher.update({ where: { id: voucherId }, data: { usedCount: { increment: 1 } } });
  }
  redirect(`/thue/hoan-tat/${order.code}`);
}

// Khach tu huy don cua chinh minh khi chua thanh toan (hoan luot voucher)
export async function cancelMyOrderAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  const orderId = String(formData.get("orderId") ?? "");
  const back = String(formData.get("back") ?? "/portal/don-thue");
  const order = await prisma.rentalOrder.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== user.id || order.status !== "CHO_THANH_TOAN") redirect(back);
  await prisma.rentalOrder.update({ where: { id: orderId }, data: { status: "DA_HUY" } });
  if (order.voucherId) {
    const v = await prisma.voucher.findUnique({ where: { id: order.voucherId } });
    if (v && v.usedCount > 0) await prisma.voucher.update({ where: { id: v.id }, data: { usedCount: { decrement: 1 } } });
  }
  revalidatePath("/portal/don-thue");
  redirect(`${back}?ok=${encodeURIComponent(`Đã huỷ đơn ${order.code}`)}`);
}

// ---------- KHACH: HO SO / BAO MAT ----------
export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) redirect("/portal/ho-so?loi=" + encodeURIComponent("Vui lòng nhập họ tên"));
  await prisma.user.update({ where: { id: user.id }, data: { name, phone: phone || null } });
  revalidatePath("/portal");
  redirect("/portal/ho-so?ok=" + encodeURIComponent("Đã cập nhật thông tin cá nhân"));
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) redirect("/portal/ho-so?loi=" + encodeURIComponent("Mật khẩu hiện tại không đúng"));
  if (next.length < 6) redirect("/portal/ho-so?loi=" + encodeURIComponent("Mật khẩu mới tối thiểu 6 ký tự"));
  if (next !== confirm) redirect("/portal/ho-so?loi=" + encodeURIComponent("Nhập lại mật khẩu mới chưa khớp"));
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  redirect("/portal/ho-so?ok=" + encodeURIComponent("Đã đổi mật khẩu thành công"));
}

// ---------- KHACH: GIA HAN WEBSITE ----------
export async function createRenewalAction(formData: FormData) {
  const user = await getCurrentUser();
  const siteId = String(formData.get("siteId") ?? "");
  const timePackageId = String(formData.get("timePackageId") ?? "");
  const voucherCode = String(formData.get("voucherCode") ?? "").trim();
  const back = `/portal/website/${siteId}`;
  if (!user) redirect(`/dang-nhap?tieptuc=${encodeURIComponent(back)}`);
  const [site, pkg] = await Promise.all([
    prisma.site.findUnique({ where: { id: siteId } }),
    prisma.timePackage.findUnique({ where: { id: timePackageId } }),
  ]);
  if (!site || site.userId !== user.id) redirect("/portal/website?loi=" + encodeURIComponent("Website không hợp lệ"));
  if (!site.startedAt) redirect(`${back}?loi=${encodeURIComponent(`Website chưa kích hoạt nên chưa gia hạn được`)}`);
  if (!pkg || !pkg.active) redirect(`${back}?loi=${encodeURIComponent(`Gói thời gian không hợp lệ`)}`);

  const subtotal = pkg.price;
  let voucherId: string | null = null;
  let voucherCodeSaved: string | null = null;
  let voucherDiscount = 0;
  if (voucherCode) {
    const r = await checkVoucher(voucherCode, subtotal);
    if (!r.ok) redirect(`${back}?loi=${encodeURIComponent("Voucher: " + r.message)}`);
    voucherId = r.voucher.id;
    voucherCodeSaved = r.voucher.code;
    voucherDiscount = r.discount;
  }
  const order = await prisma.rentalOrder.create({
    data: {
      code: genOrderCode(),
      userId: user.id,
      templateId: site.templateId,
      timePackageId: pkg.id,
      planName: pkg.name,
      planPriceMonth: Math.round(pkg.price / pkg.months),
      durationMonths: pkg.months,
      discountPercent: 0,
      subtotal,
      voucherId,
      voucherCode: voucherCodeSaved,
      voucherDiscount,
      total: subtotal - voucherDiscount,
      siteName: site.name,
      domain: site.domain,
      renewalSiteId: site.id,
    },
  });
  if (voucherId) await prisma.voucher.update({ where: { id: voucherId }, data: { usedCount: { increment: 1 } } });
  redirect(`/thue/hoan-tat/${order.code}?tb=${encodeURIComponent("Đã tạo đơn gia hạn — thanh toán xong hệ thống sẽ cộng thêm thời gian cho website của bạn")}`);
}

// ---------- HO TRO (ticket) ----------
export async function createTicketAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) redirect("/portal/ho-tro?loi=" + encodeURIComponent("Vui lòng nhập tiêu đề và nội dung yêu cầu"));
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: user.id,
      subject,
      messages: { create: { sender: "USER", body } },
    },
  });
  redirect(`/portal/ho-tro/${ticket.id}?ok=${encodeURIComponent(`Đã gửi yêu cầu — đội hỗ trợ sẽ phản hồi sớm nhất`)}`);
}

export async function replyTicketAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.userId !== user.id) redirect("/portal/ho-tro");
  if (!body) redirect(`/portal/ho-tro/${ticketId}?loi=${encodeURIComponent(`Vui lòng nhập nội dung trả lời`)}`);
  if (ticket.status === "CLOSED") redirect(`/portal/ho-tro/${ticketId}?loi=${encodeURIComponent(`Yêu cầu đã đóng — hãy tạo yêu cầu mới`)}`);
  await prisma.ticketMessage.create({ data: { ticketId, sender: "USER", body } });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "OPEN" } });
  redirect(`/portal/ho-tro/${ticketId}?ok=${encodeURIComponent(`Đã gửi trả lời`)}`);
}

export async function adminReplyTicketAction(formData: FormData) {
  await requireAdmin();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/admin/ho-tro/${ticketId}?loi=${encodeURIComponent(`Vui lòng nhập nội dung trả lời`)}`);
  await prisma.ticketMessage.create({ data: { ticketId, sender: "ADMIN", body } });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "ANSWERED" } });
  redirect(`/admin/ho-tro/${ticketId}?ok=${encodeURIComponent(`Đã trả lời khách hàng`)}`);
}

export async function setTicketStatusAction(formData: FormData) {
  const admin = await getCurrentUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["OPEN", "ANSWERED", "CLOSED"].includes(status)) redirect("/admin/ho-tro");
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) redirect("/admin/ho-tro");
  const isAdmin = admin?.role === "ADMIN";
  if (!isAdmin && ticket.userId !== admin?.id) redirect("/portal/ho-tro");
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
  if (isAdmin) await logActivity("TICKET_STATUS", `Đổi trạng thái ticket "${ticket.subject}" → ${status}`);
  redirect(`${isAdmin ? "/admin/ho-tro" : "/portal/ho-tro"}/${ticketId}?ok=${encodeURIComponent(`Đã cập nhật trạng thái yêu cầu`)}`);
}

// ---------- ADMIN: MAU ----------
function templateFromForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  return {
    name,
    slug: slugify(String(formData.get("slug") ?? "") || name),
    category: String(formData.get("category") ?? "Khác").trim(),
    description: String(formData.get("description") ?? "").trim(),
    coverImage: String(formData.get("coverImage") ?? "").trim() || null,
    gallery: String(formData.get("gallery") ?? ""),
    features: String(formData.get("features") ?? ""),
    demoUrl: String(formData.get("demoUrl") ?? "").trim() || null,
    folderSlug: String(formData.get("folderSlug") ?? "").trim() || null,
    premium: formData.get("premium") === "on",
    minPlanTier: Number(formData.get("minPlanTier") ?? 1),
    status: String(formData.get("status") ?? "PUBLISHED"),
    sort: Number(formData.get("sort") ?? 0),
  };
}

export async function saveTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const data = templateFromForm(formData);
  if (id) await prisma.template.update({ where: { id }, data });
  else await prisma.template.create({ data });
  await logActivity("TEMPLATE", `${id ? "Cập nhật" : "Tạo mới"} mẫu website "${data.name}"`);
  revalidatePath("/admin/mau");
  revalidatePath("/mau");
  redirect("/admin/mau");
}

export async function deleteTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await prisma.rentalOrder.count({ where: { templateId: id } });
  if (used > 0) redirect("/admin/mau?loi=" + encodeURIComponent("Mẫu đã có đơn thuê, không xoá được — hãy chuyển sang Nháp"));
  const tplDel = await prisma.template.findUnique({ where: { id }, select: { name: true } });
  await prisma.template.delete({ where: { id } });
  await logActivity("TEMPLATE", `Xoá mẫu website "${tplDel?.name ?? id}"`);
  revalidatePath("/admin/mau");
  redirect("/admin/mau");
}

// ---------- ADMIN: GOI ----------
export async function savePlanAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const data = {
    name,
    slug: slugify(String(formData.get("slug") ?? "") || name),
    tier: Number(formData.get("tier") ?? 1),
    priceMonth: Number(formData.get("priceMonth") ?? 0),
    storageGb: Number(formData.get("storageGb") ?? 0),
    bandwidthGb: Number(formData.get("bandwidthGb") ?? 0),
    pagesLimit: Number(formData.get("pagesLimit") ?? -1),
    productsLimit: Number(formData.get("productsLimit") ?? -1),
    cmsUsers: Number(formData.get("cmsUsers") ?? 1),
    domains: Number(formData.get("domains") ?? 1),
    features: String(formData.get("features") ?? ""),
    excluded: String(formData.get("excluded") ?? ""),
    ecommerce: formData.get("ecommerce") === "on",
    highlight: formData.get("highlight") === "on",
    active: formData.get("active") === "on",
    sort: Number(formData.get("sort") ?? 0),
  };
  if (id) await prisma.plan.update({ where: { id }, data });
  else await prisma.plan.create({ data });
  revalidatePath("/admin/goi");
  revalidatePath("/bang-gia");
  redirect("/admin/goi");
}

export async function deletePlanAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await prisma.rentalOrder.count({ where: { planId: id } });
  if (used > 0) redirect("/admin/goi?loi=" + encodeURIComponent("Gói đã có đơn thuê, không xoá được — hãy tắt Kích hoạt"));
  await prisma.plan.delete({ where: { id } });
  revalidatePath("/admin/goi");
  redirect("/admin/goi");
}

// ---------- ADMIN: THOI HAN ----------
export async function saveDurationAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const data = {
    months: Number(formData.get("months") ?? 1),
    discountPercent: Number(formData.get("discountPercent") ?? 0),
    label: String(formData.get("label") ?? "").trim() || null,
    active: formData.get("active") === "on",
    sort: Number(formData.get("sort") ?? 0),
  };
  if (id) await prisma.durationOption.update({ where: { id }, data });
  else await prisma.durationOption.create({ data });
  revalidatePath("/admin/thoi-han");
  redirect("/admin/thoi-han");
}

export async function deleteDurationAction(formData: FormData) {
  await requireAdmin();
  await prisma.durationOption.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/admin/thoi-han");
  redirect("/admin/thoi-han");
}

// ---------- ADMIN: FAQ ----------
export async function saveFaqAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const data = {
    question: String(formData.get("question") ?? "").trim(),
    answer: String(formData.get("answer") ?? "").trim(),
    sort: Number(formData.get("sort") ?? 0),
    active: formData.get("active") === "on",
  };
  if (id) await prisma.faq.update({ where: { id }, data });
  else await prisma.faq.create({ data });
  revalidatePath("/admin/faq");
  revalidatePath("/");
  redirect("/admin/faq");
}

export async function deleteFaqAction(formData: FormData) {
  await requireAdmin();
  await prisma.faq.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/admin/faq");
  redirect("/admin/faq");
}

// ---------- ADMIN: GOI THOI GIAN ----------
export async function saveTimePackageAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/goi-thoi-gian?loi=" + encodeURIComponent("Vui lòng nhập tên gói"));
  const data = {
    name,
    slug: slugify(String(formData.get("slug") ?? "") || name),
    months: Math.max(1, Number(formData.get("months") ?? 1)),
    price: Math.max(0, Number(formData.get("price") ?? 0)),
    compareAt: Math.max(0, Number(formData.get("compareAt") ?? 0)),
    tier: Math.max(1, Number(formData.get("tier") ?? 1)),
    storageGb: Number(formData.get("storageGb") ?? 5),
    bandwidthGb: Number(formData.get("bandwidthGb") ?? 100),
    pagesLimit: Number(formData.get("pagesLimit") ?? -1),
    productsLimit: Number(formData.get("productsLimit") ?? -1),
    cmsUsers: Number(formData.get("cmsUsers") ?? 2),
    ecommerce: formData.get("ecommerce") === "on",
    features: String(formData.get("features") ?? ""),
    highlight: formData.get("highlight") === "on",
    active: formData.get("active") === "on",
    sort: Number(formData.get("sort") ?? 0),
  };
  const dup = await prisma.timePackage.findUnique({ where: { slug: data.slug } });
  if (dup && dup.id !== id) redirect("/admin/goi-thoi-gian?loi=" + encodeURIComponent("Slug gói đã tồn tại"));
  if (id) await prisma.timePackage.update({ where: { id }, data });
  else await prisma.timePackage.create({ data });
  await logActivity("TIME_PACKAGE", `${id ? "Cập nhật" : "Tạo mới"} gói thời gian "${name}" (${data.months} tháng — ${data.price.toLocaleString("vi-VN")} ₫)`);
  revalidatePath("/admin/goi-thoi-gian");
  revalidatePath("/bang-gia");
  revalidatePath("/mau");
  redirect("/admin/goi-thoi-gian?ok=" + encodeURIComponent("Đã lưu gói " + name));
}

export async function deleteTimePackageAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await prisma.rentalOrder.count({ where: { timePackageId: id } });
  if (used > 0) redirect("/admin/goi-thoi-gian?loi=" + encodeURIComponent("Gói đã có đơn thuê, không xoá được — hãy tắt Kích hoạt"));
  const pkgDel = await prisma.timePackage.findUnique({ where: { id }, select: { name: true } });
  await prisma.timePackage.delete({ where: { id } });
  await logActivity("TIME_PACKAGE", `Xoá gói thời gian "${pkgDel?.name ?? id}"`);
  revalidatePath("/admin/goi-thoi-gian");
  revalidatePath("/bang-gia");
  redirect("/admin/goi-thoi-gian?ok=" + encodeURIComponent("Đã xoá gói"));
}

// ---------- ADMIN: VOUCHER ----------
function dateOrNull(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function saveVoucherAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) redirect("/admin/voucher?loi=" + encodeURIComponent("Vui lòng nhập mã voucher"));
  const type = String(formData.get("type") ?? "PERCENT") === "FIXED" ? "FIXED" : "PERCENT";
  const data = {
    code,
    description: String(formData.get("description") ?? "").trim(),
    type,
    value: Math.max(0, Number(formData.get("value") ?? 0)),
    maxDiscount: Math.max(0, Number(formData.get("maxDiscount") ?? 0)),
    minTotal: Math.max(0, Number(formData.get("minTotal") ?? 0)),
    usageLimit: Math.max(0, Number(formData.get("usageLimit") ?? 0)),
    startsAt: dateOrNull(formData.get("startsAt")),
    expiresAt: dateOrNull(formData.get("expiresAt")),
    active: formData.get("active") === "on",
  };
  if (data.type === "PERCENT") data.value = Math.min(100, data.value);
  const dup = await prisma.voucher.findUnique({ where: { code } });
  if (dup && dup.id !== id) redirect("/admin/voucher?loi=" + encodeURIComponent("Mã voucher đã tồn tại"));
  if (id) await prisma.voucher.update({ where: { id }, data });
  else await prisma.voucher.create({ data });
  await logActivity("VOUCHER", `${id ? "Cập nhật" : "Tạo mới"} voucher ${code} (${type === "PERCENT" ? `giảm ${data.value}%` : `giảm ${data.value.toLocaleString("vi-VN")} ₫`})`);
  revalidatePath("/admin/voucher");
  revalidatePath("/");
  redirect("/admin/voucher?ok=" + encodeURIComponent("Đã lưu voucher " + code));
}

export async function deleteVoucherAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await prisma.rentalOrder.count({ where: { voucherId: id } });
  if (used > 0) redirect("/admin/voucher?loi=" + encodeURIComponent("Voucher đã có đơn dùng, không xoá được — hãy tắt Kích hoạt"));
  const vouDel = await prisma.voucher.findUnique({ where: { id }, select: { code: true } });
  await prisma.voucher.delete({ where: { id } });
  await logActivity("VOUCHER", `Xoá voucher ${vouDel?.code ?? id}`);
  revalidatePath("/admin/voucher");
  revalidatePath("/");
  redirect("/admin/voucher?ok=" + encodeURIComponent("Đã xoá voucher"));
}

// ---------- ADMIN: TIN TUC ----------
export async function saveNewsAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/admin/tin-tuc?loi=" + encodeURIComponent("Vui lòng nhập tiêu đề bài viết"));
  const data = {
    title,
    slug: slugify(String(formData.get("slug") ?? "") || title),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? ""),
    coverImage: String(formData.get("coverImage") ?? "").trim() || null,
    category: String(formData.get("category") ?? "Tin tức").trim() || "Tin tức",
    published: formData.get("published") === "on",
    sort: Number(formData.get("sort") ?? 0),
  };
  const dup = await prisma.newsPost.findUnique({ where: { slug: data.slug } });
  if (dup && dup.id !== id) redirect(`/admin/tin-tuc/${id || "moi"}?loi=${encodeURIComponent(`Slug đã tồn tại, chọn slug khác`)}`);
  if (id) await prisma.newsPost.update({ where: { id }, data });
  else await prisma.newsPost.create({ data });
  await logActivity("NEWS", `${id ? "Cập nhật" : "Đăng"} bài viết "${title}"`);
  revalidatePath("/admin/tin-tuc");
  revalidatePath("/tin-tuc");
  revalidatePath("/");
  redirect("/admin/tin-tuc?ok=" + encodeURIComponent("Đã lưu bài viết"));
}

export async function deleteNewsAction(formData: FormData) {
  await requireAdmin();
  const newsDelId = String(formData.get("id") ?? "");
  const newsDel = await prisma.newsPost.findUnique({ where: { id: newsDelId }, select: { title: true } });
  await prisma.newsPost.delete({ where: { id: newsDelId } });
  await logActivity("NEWS", `Xoá bài viết "${newsDel?.title ?? newsDelId}"`);
  revalidatePath("/admin/tin-tuc");
  revalidatePath("/tin-tuc");
  revalidatePath("/");
  redirect("/admin/tin-tuc?ok=" + encodeURIComponent("Đã xoá bài viết"));
}

// ---------- ADMIN: CAI DAT ----------
export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const s = await getSettings();
  await prisma.setting.update({
    where: { id: s.id },
    data: {
      brandName: String(formData.get("brandName") ?? "").trim(),
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      heroTitle: String(formData.get("heroTitle") ?? "").trim(),
      heroSubtitle: String(formData.get("heroSubtitle") ?? "").trim(),
      heroCtaText: String(formData.get("heroCtaText") ?? "").trim(),
      supportEmail: String(formData.get("supportEmail") ?? "").trim(),
      supportPhone: String(formData.get("supportPhone") ?? "").trim(),
      zaloUrl: String(formData.get("zaloUrl") ?? "").trim() || null,
      platformDomain: String(formData.get("platformDomain") ?? "").trim(),
      cnameTarget: String(formData.get("cnameTarget") ?? "").trim(),
      acmeTarget: String(formData.get("acmeTarget") ?? "").trim(),
      bankCode: String(formData.get("bankCode") ?? "").trim(),
      bankAccount: String(formData.get("bankAccount") ?? "").trim(),
      bankOwner: String(formData.get("bankOwner") ?? "").trim(),
      trialDays: Number(formData.get("trialDays") ?? 7),
      graceDays: Number(formData.get("graceDays") ?? 7),
      archiveDays: Number(formData.get("archiveDays") ?? 30),
      capacityDiskGb: Math.max(1, Number(formData.get("capacityDiskGb") ?? 200)),
      capacityBandwidthGb: Math.max(1, Number(formData.get("capacityBandwidthGb") ?? 10000)),
      oversellRatio: Math.min(5, Math.max(1, Number(formData.get("oversellRatio") ?? 1))),
      footerText: String(formData.get("footerText") ?? "").trim(),
    },
  });
  await logActivity("SAVE_SETTINGS", "Cập nhật cài đặt hệ thống (thương hiệu, liên hệ, ngân hàng, DNS, sức chứa VPS, vòng đời thuê)");
  bustSettingsCache();
  revalidatePath("/admin/cai-dat");
  revalidatePath("/");
  redirect("/admin/cai-dat?ok=" + encodeURIComponent("Đã lưu cài đặt hệ thống"));
}

// ---------- ADMIN: DON THUE / WEBSITE ----------
export async function confirmPaymentAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.rentalOrder.findUnique({ where: { id: orderId }, include: { site: true, timePackage: true, plan: true } });
  if (!order || order.status !== "CHO_THANH_TOAN") redirect("/admin/don-thue");
  // Don tao website MOI: kiem tra suc chua VPS truoc khi nhan tien —
  // han muc cua goi se duoc cap tu dong cho website sap tao.
  const quota = quotaFromPackage(order.timePackage ?? order.plan);
  if (!order.renewalSiteId && !order.site) {
    const cap = await canAllocate(quota);
    if (!cap.ok) {
      redirect(`/admin/don-thue/${orderId}?loi=${encodeURIComponent("Chưa xác nhận được: " + (cap.reason ?? "hệ thống đã hết dung lượng"))}`);
    }
  }
  await prisma.rentalOrder.update({
    where: { id: orderId },
    data: { status: "DA_THANH_TOAN", paidAt: new Date() },
  });
  await logActivity("CONFIRM_PAYMENT", `Xác nhận thanh toán đơn ${order.code} — ${order.total.toLocaleString("vi-VN")} ₫ (${order.renewalSiteId ? "gia hạn" : "thuê mới"}, tên miền ${order.domain})`);
  if (order.renewalSiteId) {
    // Don GIA HAN: cong them thoi gian vao website hien tai (tu han cu neu con han, tu hom nay neu da het)
    const site = await prisma.site.findUnique({ where: { id: order.renewalSiteId } });
    if (site) {
      const now = new Date();
      const base = site.expiresAt && site.expiresAt > now ? site.expiresAt : now;
      const expires = new Date(base);
      expires.setMonth(expires.getMonth() + order.durationMonths);
      await prisma.site.update({
        where: { id: site.id },
        data: {
          expiresAt: expires,
          status: "DANG_HOAT_DONG",
          timePackageId: order.timePackageId ?? site.timePackageId,
          // Gia han theo goi nao thi han muc cap nhat theo goi do
          quotaStorageGb: quota.storageGb,
          quotaBandwidthGb: quota.bandwidthGb,
          quotaPages: quota.pages,
          quotaProducts: quota.products,
          quotaCmsUsers: quota.cmsUsers,
        },
      });
    }
    revalidatePath("/admin/don-thue");
    redirect(`/admin/don-thue/${orderId}?ok=${encodeURIComponent(`Đã xác nhận gia hạn — website đã được cộng thêm ${order.durationMonths} tháng`)}`);
  }
  if (!order.site) {
    // He thong tu tao ban ghi website: slug duy nhat + token DNS rieng
    let base = slugify(order.siteName) || "website";
    let slug = base;
    let i = 2;
    while (await prisma.site.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
    await prisma.site.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        templateId: order.templateId,
        planId: order.planId,
        timePackageId: order.timePackageId,
        name: order.siteName,
        slug,
        domain: order.domain,
        dnsToken: crypto.randomBytes(10).toString("hex"),
        licenseKey: await generateUniqueLicenseKey(), // moi lan thue 1 key kich hoat rieng
        status: "CHO_TRO_DNS",
        // TU DONG CHIA DUNG LUONG: han muc cua goi duoc cap ngay cho website nay
        quotaStorageGb: quota.storageGb,
        quotaBandwidthGb: quota.bandwidthGb,
        quotaPages: quota.pages,
        quotaProducts: quota.products,
        quotaCmsUsers: quota.cmsUsers,
        usagePeriod: new Date().toISOString().slice(0, 7),
      },
    });
  }
  revalidatePath("/admin/don-thue");
  redirect(`/admin/don-thue/${orderId}?ok=${encodeURIComponent(`Đã xác nhận thanh toán và tạo website`)}`);
}

// Admin cap lai key kich hoat cho website (key cu vo hieu, trang thai kich hoat dat lai)
export async function regenerateLicenseKeyAction(formData: FormData) {
  await requireAdmin();
  const siteId = String(formData.get("siteId") ?? "");
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) redirect("/admin/website");
  const key = await generateUniqueLicenseKey();
  await prisma.site.update({ where: { id: siteId }, data: { licenseKey: key, keyActivatedAt: null } });
  await logActivity("REGEN_KEY", `Cấp lại key kích hoạt cho website ${site.name} (${site.domain}) — key cũ đã mất hiệu lực`);
  revalidatePath("/admin/website");
  revalidatePath(`/portal/website/${siteId}`);
  redirect(`/admin/website?ok=${encodeURIComponent(`Đã cấp key mới cho website ${site.name}: ${key}`)}`);
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.rentalOrder.findUnique({ where: { id: orderId } });
  await prisma.rentalOrder.update({ where: { id: orderId }, data: { status: "DA_HUY" } });
  await logActivity("CANCEL_ORDER", `Huỷ đơn ${order?.code ?? orderId} (${order ? order.total.toLocaleString("vi-VN") + " ₫" : "?"})`);
  // Don bi huy thi hoan lai luot dung voucher
  if (order?.voucherId && order.status !== "DA_HUY") {
    const v = await prisma.voucher.findUnique({ where: { id: order.voucherId } });
    if (v && v.usedCount > 0) {
      await prisma.voucher.update({ where: { id: v.id }, data: { usedCount: { decrement: 1 } } });
    }
  }
  revalidatePath("/admin/don-thue");
  redirect("/admin/don-thue");
}

export async function activateSiteAction(formData: FormData) {
  await requireAdmin();
  const siteId = String(formData.get("siteId") ?? "");
  const back = String(formData.get("back") ?? "/admin/don-thue");
  const site = await prisma.site.findUnique({ where: { id: siteId }, include: { order: true } });
  if (!site) redirect(back);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + site.order.durationMonths);
  await prisma.site.update({
    where: { id: siteId },
    data: { status: "DANG_HOAT_DONG", startedAt: now, expiresAt },
  });
  await logActivity("ACTIVATE_SITE", `Kích hoạt website ${site.name} (${site.domain}) — hạn thuê đến ${expiresAt.toLocaleDateString("vi-VN")}`);
  revalidatePath(back);
  redirect(`${back}?ok=${encodeURIComponent(`Website đã kích hoạt, hạn thuê tính từ hôm nay`)}`);
}

export async function setSiteStatusAction(formData: FormData) {
  await requireAdmin();
  const siteId = String(formData.get("siteId") ?? "");
  const status = String(formData.get("status") ?? "");
  const back = String(formData.get("back") ?? "/admin/website");
  if (["DANG_HOAT_DONG", "TAM_NGUNG", "HET_HAN", "CHO_TRO_DNS"].includes(status)) {
    const site = await prisma.site.findUnique({ where: { id: siteId }, select: { name: true, domain: true } });
    await prisma.site.update({ where: { id: siteId }, data: { status } });
    await logActivity("SET_SITE_STATUS", `Đổi trạng thái website ${site?.name ?? siteId} (${site?.domain ?? ""}) → ${status}`);
  }
  revalidatePath(back);
  redirect(back);
}
