import { NextRequest, NextResponse } from "next/server";
import { checkDomain } from "@/lib/domain";
import { getSettings, prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { domain } = await req.json().catch(() => ({ domain: "" }));
  const settings = await getSettings();
  const result = await checkDomain(String(domain ?? ""), settings.cnameTarget);
  let used = false;
  if (result.valid) {
    const [site, order] = await Promise.all([
      prisma.site.findFirst({ where: { domain: result.domain } }),
      prisma.rentalOrder.findFirst({ where: { domain: result.domain, status: { not: "DA_HUY" } } }),
    ]);
    used = !!site || !!order;
    if (used) result.messages.push("Tên miền này đã được sử dụng trong hệ thống, vui lòng chọn tên miền khác.");
  }
  return NextResponse.json({ ...result, used });
}
