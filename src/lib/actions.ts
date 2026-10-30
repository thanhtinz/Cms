"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { prisma, getSettings } from "./db";
import { createSession, destroySession, hashPassword, verifyPassword, requireAdmin, getCurrentUser } from "./auth";
import { slugify, splitLines } from "./utils";
import { normalizeDomain } from "./domain";
import { checkVoucher } from "./voucher";

// ---------- AUTH ----------
export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!email || !password || !name) redirect("/dang-ky?loi=Vui lòng nhập đủ họ tên, email và mật khẩu");
  if (password.length < 6) redirect("/dang-ky?loi=Mật khẩu tối thiểu 6 ký tự");
  const existed = await prisma.user.findUnique({ where: { email } });
  if (existed) redirect("/dang-ky?loi=Email này đã có tài khoản, hãy đăng nhập");
  const user = await prisma.user.create({
    data: { email, name, phone: phone || null, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect("/portal");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/dang-nhap?loi=Email hoặc mật khẩu không đúng");
  }
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/portal");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
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
  if (!template || template.status !== "PUBLISHED") redirect(`${back}?loi=Mẫu website không hợp lệ`);
  if (!pkg || !pkg.active) redirect(`${back}?loi=Gói thời gian không hợp lệ`);
  if (pkg.tier < template.minPlanTier) redirect(`${back}?loi=Mẫu này cần gói thời gian từ tier ${template.minPlanTier} trở lên`);
  if (!siteName) redirect(`${back}?loi=Vui lòng nhập tên website`);
  if (!domain) redirect(`${back}?loi=Vui lòng nhập tên miền của bạn`);

  const dup = await prisma.site.findFirst({ where: { domain } });
  const dupOrder = await prisma.rentalOrder.findFirst({ where: { domain, status: { not: "DA_HUY" } } });
  if (dup || dupOrder) redirect(`${back}?loi=Tên miền này đã được dùng trong hệ thống`);

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
  revalidatePath("/admin/mau");
  revalidatePath("/mau");
  redirect("/admin/mau");
}

export async function deleteTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await prisma.rentalOrder.count({ where: { templateId: id } });
  if (used > 0) redirect("/admin/mau?loi=Mẫu đã có đơn thuê, không xoá được — hãy chuyển sang Nháp");
  await prisma.template.delete({ where: { id } });
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
  if (used > 0) redirect("/admin/goi?loi=Gói đã có đơn thuê, không xoá được — hãy tắt Kích hoạt");
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
  if (!name) redirect("/admin/goi-thoi-gian?loi=Vui lòng nhập tên gói");
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
  if (dup && dup.id !== id) redirect("/admin/goi-thoi-gian?loi=Slug gói đã tồn tại");
  if (id) await prisma.timePackage.update({ where: { id }, data });
  else await prisma.timePackage.create({ data });
  revalidatePath("/admin/goi-thoi-gian");
  revalidatePath("/bang-gia");
  revalidatePath("/mau");
  redirect("/admin/goi-thoi-gian?ok=Đã lưu gói " + name);
}

export async function deleteTimePackageAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await prisma.rentalOrder.count({ where: { timePackageId: id } });
  if (used > 0) redirect("/admin/goi-thoi-gian?loi=Gói đã có đơn thuê, không xoá được — hãy tắt Kích hoạt");
  await prisma.timePackage.delete({ where: { id } });
  revalidatePath("/admin/goi-thoi-gian");
  revalidatePath("/bang-gia");
  redirect("/admin/goi-thoi-gian?ok=Đã xoá gói");
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
  if (!code) redirect("/admin/voucher?loi=Vui lòng nhập mã voucher");
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
  if (dup && dup.id !== id) redirect("/admin/voucher?loi=Mã voucher đã tồn tại");
  if (id) await prisma.voucher.update({ where: { id }, data });
  else await prisma.voucher.create({ data });
  revalidatePath("/admin/voucher");
  revalidatePath("/");
  redirect("/admin/voucher?ok=Đã lưu voucher " + code);
}

export async function deleteVoucherAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const used = await prisma.rentalOrder.count({ where: { voucherId: id } });
  if (used > 0) redirect("/admin/voucher?loi=Voucher đã có đơn dùng, không xoá được — hãy tắt Kích hoạt");
  await prisma.voucher.delete({ where: { id } });
  revalidatePath("/admin/voucher");
  revalidatePath("/");
  redirect("/admin/voucher?ok=Đã xoá voucher");
}

// ---------- ADMIN: TIN TUC ----------
export async function saveNewsAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/admin/tin-tuc?loi=Vui lòng nhập tiêu đề bài viết");
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
  if (dup && dup.id !== id) redirect(`/admin/tin-tuc/${id || "moi"}?loi=Slug đã tồn tại, chọn slug khác`);
  if (id) await prisma.newsPost.update({ where: { id }, data });
  else await prisma.newsPost.create({ data });
  revalidatePath("/admin/tin-tuc");
  revalidatePath("/tin-tuc");
  revalidatePath("/");
  redirect("/admin/tin-tuc?ok=Đã lưu bài viết");
}

export async function deleteNewsAction(formData: FormData) {
  await requireAdmin();
  await prisma.newsPost.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/admin/tin-tuc");
  revalidatePath("/tin-tuc");
  revalidatePath("/");
  redirect("/admin/tin-tuc?ok=Đã xoá bài viết");
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
      footerText: String(formData.get("footerText") ?? "").trim(),
    },
  });
  revalidatePath("/admin/cai-dat");
  revalidatePath("/");
  redirect("/admin/cai-dat?ok=1");
}

// ---------- ADMIN: DON THUE / WEBSITE ----------
export async function confirmPaymentAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.rentalOrder.findUnique({ where: { id: orderId }, include: { site: true } });
  if (!order || order.status !== "CHO_THANH_TOAN") redirect("/admin/don-thue");
  await prisma.rentalOrder.update({
    where: { id: orderId },
    data: { status: "DA_THANH_TOAN", paidAt: new Date() },
  });
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
        status: "CHO_TRO_DNS",
      },
    });
  }
  revalidatePath("/admin/don-thue");
  redirect(`/admin/don-thue/${orderId}?ok=Đã xác nhận thanh toán và tạo website`);
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.rentalOrder.findUnique({ where: { id: orderId } });
  await prisma.rentalOrder.update({ where: { id: orderId }, data: { status: "DA_HUY" } });
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
  revalidatePath(back);
  redirect(`${back}?ok=Website đã kích hoạt, hạn thuê tính từ hôm nay`);
}

export async function setSiteStatusAction(formData: FormData) {
  await requireAdmin();
  const siteId = String(formData.get("siteId") ?? "");
  const status = String(formData.get("status") ?? "");
  const back = String(formData.get("back") ?? "/admin/website");
  if (["DANG_HOAT_DONG", "TAM_NGUNG", "HET_HAN", "CHO_TRO_DNS"].includes(status)) {
    await prisma.site.update({ where: { id: siteId }, data: { status } });
  }
  revalidatePath(back);
  redirect(back);
}
