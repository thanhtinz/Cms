import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { draftTicketReply } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Admin bam "AI soan tra loi" trong trang ticket: AI doc toan bo hoi thoai +
// du kien don/website cua khach va soan mot ban nhap — admin doc lai, sua
// neu can roi moi bam Gui (AI khong tu gui).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Chỉ quản trị viên mới dùng được" }, { status: 403 });
  }
  const { ticketId } = (await req.json().catch(() => ({}))) as { ticketId?: string };
  if (!ticketId) return NextResponse.json({ ok: false, message: "Thiếu ticketId" });
  const res = await draftTicketReply(ticketId);
  if (!res.ok) return NextResponse.json({ ok: false, message: res.reason });
  return NextResponse.json({ ok: true, draft: res.draft });
}
