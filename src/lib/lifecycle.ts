import { prisma } from "./db";

// Quét vòng đời thuê: website đang chạy (hoặc tạm ngưng) mà đã quá ngày hết hạn
// thì tự chuyển sang HET_HAN. Được gọi bởi:
// - Vercel Cron mỗi ngày (route /api/cron/vong-doi)
// - Nút "Chạy kiểm tra vòng đời ngay" của admin trên Tổng quan quản trị
export async function runLifecycleSweep() {
  const now = new Date();
  const expired = await prisma.site.findMany({
    where: { status: { in: ["DANG_HOAT_DONG", "TAM_NGUNG"] }, expiresAt: { lt: now } },
    select: { id: true, name: true, domain: true, expiresAt: true },
  });
  if (expired.length > 0) {
    await prisma.site.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { status: "HET_HAN" },
    });
  }
  return { expiredCount: expired.length, expired };
}
