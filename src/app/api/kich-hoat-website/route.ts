import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// API kich hoat website lan dau: website con (trong sites/) goi endpoint nay
// o buoc setup dau tien voi key khach nhan duoc trong Dashboard.
// POST /api/kich-hoat-website  { "key": "TW-XXXXXX-XXXXXX-XXXXXX", "domain": "shop.vn" }
// - Key dung + chua kich hoat -> danh dau keyActivatedAt, tra thong tin website
// - Key dung + da kich hoat -> tra alreadyActivated: true (khong loi)
// - Key sai / domain khong khop / web het han -> 4xx kem ly do
export async function POST(req: NextRequest) {
  let body: { key?: string; domain?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Body phải là JSON" }, { status: 400 });
  }
  const key = String(body.key ?? "").trim().toUpperCase();
  if (!key) return NextResponse.json({ ok: false, message: "Thiếu key kích hoạt" }, { status: 400 });

  const site = await prisma.site.findUnique({
    where: { licenseKey: key },
    include: { timePackage: true, template: true, order: { select: { planName: true } } },
  });
  if (!site) return NextResponse.json({ ok: false, message: "Key không tồn tại" }, { status: 404 });

  const domain = String(body.domain ?? "").trim().toLowerCase();
  if (domain && domain !== site.domain.toLowerCase()) {
    return NextResponse.json({ ok: false, message: "Key không thuộc về tên miền này" }, { status: 403 });
  }
  if (site.status === "HET_HAN") {
    return NextResponse.json({ ok: false, message: "Website đã hết hạn thuê — gia hạn để tiếp tục" }, { status: 403 });
  }

  const alreadyActivated = !!site.keyActivatedAt;
  if (!alreadyActivated) {
    await prisma.site.update({ where: { id: site.id }, data: { keyActivatedAt: new Date() } });
  }

  return NextResponse.json({
    ok: true,
    alreadyActivated,
    site: {
      id: site.id,
      name: site.name,
      domain: site.domain,
      template: site.template.name,
      package: site.timePackage?.name ?? site.order.planName,
      status: site.status,
      expiresAt: site.expiresAt,
      quotas: {
        storageGb: site.quotaStorageGb,
        bandwidthGb: site.quotaBandwidthGb,
        pages: site.quotaPages,
        products: site.quotaProducts,
        cmsUsers: site.quotaCmsUsers,
      },
    },
  });
}
