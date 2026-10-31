import { prisma, getSettings } from "./db";

// Trang thai website con chiem han muc tren VPS
export const ALLOCATED_STATUSES = ["CHO_TRO_DNS", "DANG_HOAT_DONG", "TAM_NGUNG"];

export interface Quota {
  storageGb: number;
  bandwidthGb: number;
  pages: number;
  products: number;
  cmsUsers: number;
}

// Han muc cua 1 goi (goi thoi gian moi hoac goi thang cu) de cap cho website
export function quotaFromPackage(pkg: {
  storageGb: number; bandwidthGb: number; pagesLimit: number; productsLimit: number; cmsUsers: number;
} | null): Quota {
  if (!pkg) return { storageGb: 5, bandwidthGb: 100, pages: -1, products: -1, cmsUsers: 2 };
  return {
    storageGb: pkg.storageGb,
    bandwidthGb: pkg.bandwidthGb,
    pages: pkg.pagesLimit,
    products: pkg.productsLimit,
    cmsUsers: pkg.cmsUsers,
  };
}

export interface Capacity {
  capacityDiskGb: number;
  capacityBandwidthGb: number;
  oversellRatio: number;
  limitDiskGb: number; // suc chua sau he so ban vuot
  limitBandwidthGb: number;
  allocatedDiskGb: number;
  allocatedBandwidthGb: number; // chi cong cac goi co gioi han (bo qua -1)
  freeDiskGb: number;
  freeBandwidthGb: number;
  siteCount: number;
}

// Tong hop suc chua VPS: da cap bao nhieu / con trong bao nhieu
export async function getCapacity(): Promise<Capacity> {
  const s = await getSettings();
  const agg = await prisma.site.aggregate({
    where: { status: { in: ALLOCATED_STATUSES } },
    _sum: { quotaStorageGb: true },
    _count: true,
  });
  const bwSites = await prisma.site.findMany({
    where: { status: { in: ALLOCATED_STATUSES }, quotaBandwidthGb: { gt: 0 } },
    select: { quotaBandwidthGb: true },
  });
  const allocatedBandwidthGb = bwSites.reduce((a, x) => a + x.quotaBandwidthGb, 0);
  const allocatedDiskGb = agg._sum.quotaStorageGb ?? 0;
  const limitDiskGb = Math.floor(s.capacityDiskGb * s.oversellRatio);
  const limitBandwidthGb = Math.floor(s.capacityBandwidthGb * s.oversellRatio);
  return {
    capacityDiskGb: s.capacityDiskGb,
    capacityBandwidthGb: s.capacityBandwidthGb,
    oversellRatio: s.oversellRatio,
    limitDiskGb,
    limitBandwidthGb,
    allocatedDiskGb,
    allocatedBandwidthGb,
    freeDiskGb: limitDiskGb - allocatedDiskGb,
    freeBandwidthGb: limitBandwidthGb - allocatedBandwidthGb,
    siteCount: agg._count,
  };
}

// Kiem tra con cap duoc han muc nay khong (tru di han muc cu cua chinh website do neu co)
export async function canAllocate(q: Quota, replaceSiteId?: string): Promise<{ ok: boolean; reason?: string }> {
  const cap = await getCapacity();
  let backDisk = 0;
  let backBw = 0;
  if (replaceSiteId) {
    const old = await prisma.site.findUnique({ where: { id: replaceSiteId }, select: { quotaStorageGb: true, quotaBandwidthGb: true } });
    if (old) {
      backDisk = old.quotaStorageGb;
      backBw = old.quotaBandwidthGb > 0 ? old.quotaBandwidthGb : 0;
    }
  }
  if (cap.allocatedDiskGb - backDisk + q.storageGb > cap.limitDiskGb) {
    return { ok: false, reason: `Hết dung lượng đĩa khả dụng: đã cấp ${cap.allocatedDiskGb}/${cap.limitDiskGb} GB, gói này cần thêm ${q.storageGb} GB. Tăng sức chứa VPS hoặc hệ số bán vượt trong Cài đặt.` };
  }
  if (q.bandwidthGb > 0 && cap.allocatedBandwidthGb - backBw + q.bandwidthGb > cap.limitBandwidthGb) {
    return { ok: false, reason: `Hết băng thông khả dụng: đã cấp ${cap.allocatedBandwidthGb}/${cap.limitBandwidthGb} GB, gói này cần thêm ${q.bandwidthGb} GB.` };
  }
  return { ok: true };
}

// Uoc tinh con tao duoc bao nhieu website nua cho 1 goi
export function fitsMore(cap: Capacity, q: Quota): number {
  const byDisk = q.storageGb > 0 ? Math.floor(cap.freeDiskGb / q.storageGb) : Infinity;
  const byBw = q.bandwidthGb > 0 ? Math.floor(cap.freeBandwidthGb / q.bandwidthGb) : Infinity;
  const n = Math.min(byDisk, byBw);
  return Number.isFinite(n) ? Math.max(0, n) : 9999;
}
