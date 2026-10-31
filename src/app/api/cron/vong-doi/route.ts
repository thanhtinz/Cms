import { NextRequest, NextResponse } from "next/server";
import { runLifecycleSweep } from "@/lib/lifecycle";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

// Vercel Cron goi moi ngay (khai bao trong vercel.json): quet website qua han
// va chuyen sang HET_HAN. Bao ve bang CRON_SECRET (Vercel tu gui header
// Authorization: Bearer <CRON_SECRET> khi bien moi truong nay duoc dat).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "Chưa cấu hình CRON_SECRET trên Vercel — vòng đời tự động chưa bật. Admin vẫn chạy tay được ở Tổng quan quản trị." },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Không có quyền" }, { status: 401 });
  }
  const { expiredCount, expired } = await runLifecycleSweep();
  if (expiredCount > 0) {
    await logActivity("LIFECYCLE", `Cron vòng đời: ${expiredCount} website quá hạn đã chuyển sang Hết hạn (${expired.map((s) => s.domain).join(", ")})`);
  }
  return NextResponse.json({ ok: true, expiredCount });
}
