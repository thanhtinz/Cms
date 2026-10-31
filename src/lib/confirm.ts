import crypto from "node:crypto";
import { prisma } from "./db";
import { slugify } from "./utils";
import { canAllocate, quotaFromPackage } from "./quota";
import { generateUniqueLicenseKey } from "./license";
import { logActivity } from "./activity";

export type ConfirmResult =
  | { ok: true; kind: "new-site" | "renewal" | "already-paid"; code: string }
  | { ok: false; reason: string };

// Xac nhan thanh toan mot don thue — DUNG CHUNG mot duong duy nhat cho:
// (1) admin bam nut xac nhan tay va (2) webhook SePay tu dong.
// Idempotent: don da DA_THANH_TOAN tra already-paid va khong xu ly lai;
// viec "chiem" don bang updateMany co dieu kien trang thai dam bao hai
// webhook chay gan nhu dong thoi khong tao trung website.
export async function confirmOrderPayment(orderId: string, source: "ADMIN" | "SEPAY"): Promise<ConfirmResult> {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    include: { site: true, timePackage: true, plan: true },
  });
  if (!order) return { ok: false, reason: "Không tìm thấy đơn" };
  if (order.status === "DA_THANH_TOAN") return { ok: true, kind: "already-paid", code: order.code };
  if (order.status !== "CHO_THANH_TOAN") return { ok: false, reason: `Đơn đang ở trạng thái ${order.status}` };

  // Don tao website MOI: kiem tra suc chua VPS — han muc goi se cap cho web sap tao
  const quota = quotaFromPackage(order.timePackage ?? order.plan);
  if (!order.renewalSiteId && !order.site) {
    const cap = await canAllocate(quota);
    if (!cap.ok) return { ok: false, reason: cap.reason ?? "Hệ thống đã hết dung lượng" };
  }

  // Chiem don nguyen tu: chi mot luong xu ly duy nhat thang
  const claim = await prisma.rentalOrder.updateMany({
    where: { id: orderId, status: "CHO_THANH_TOAN" },
    data: { status: "DA_THANH_TOAN", paidAt: new Date() },
  });
  if (claim.count === 0) return { ok: true, kind: "already-paid", code: order.code };

  await logActivity(
    source === "SEPAY" ? "PAYMENT_SEPAY" : "CONFIRM_PAYMENT",
    `${source === "SEPAY" ? "SePay tự xác nhận" : "Xác nhận"} thanh toán đơn ${order.code} — ${order.total.toLocaleString("vi-VN")} ₫ (${order.renewalSiteId ? "gia hạn" : "thuê mới"}, tên miền ${order.domain})`
  );

  if (order.renewalSiteId) {
    // Don GIA HAN: cong thoi gian vao website hien tai (tu han cu neu con han, tu hom nay neu da het)
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
          quotaStorageGb: quota.storageGb,
          quotaBandwidthGb: quota.bandwidthGb,
          quotaPages: quota.pages,
          quotaProducts: quota.products,
          quotaCmsUsers: quota.cmsUsers,
        },
      });
    }
    return { ok: true, kind: "renewal", code: order.code };
  }

  if (!order.site) {
    // Tu tao ban ghi website: slug duy nhat + token DNS rieng + key kich hoat rieng
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
        licenseKey: await generateUniqueLicenseKey(),
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
  return { ok: true, kind: "new-site", code: order.code };
}
