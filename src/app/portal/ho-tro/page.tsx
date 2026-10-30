import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, TICKET_STATUS } from "@/lib/utils";
import { createTicketAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Ho tro cua khach: danh sach yeu cau + tao moi
export default async function PortalSupportPage({ searchParams }: { searchParams: { loi?: string } }) {
  const user = await requireUser();
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Hỗ trợ</h1>
      <p className="mt-1 text-slate-500">Gửi yêu cầu cho đội hỗ trợ — phản hồi sẽ hiện ngay tại đây. Việc gấp có thể hỏi nhanh trợ lý AI ở bong bóng chat góc phải.</p>
      {searchParams.loi && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-5">
        <form action={createTicketAction} className="card space-y-4 p-6 lg:col-span-2">
          <h2 className="font-bold text-slate-900"><i className="fa-solid fa-pen-to-square mr-2 text-brand-600" aria-hidden /> Tạo yêu cầu mới</h2>
          <div><label className="label">Tiêu đề *</label><input name="subject" required className="input" placeholder="VD: Website chưa lên sau khi trỏ DNS" /></div>
          <div><label className="label">Nội dung chi tiết *</label><textarea name="body" required rows={6} className="input" placeholder="Mô tả càng cụ thể càng xử lý nhanh: website nào, bạn đã làm gì, lỗi hiện ra sao..." /></div>
          <button className="btn-primary w-full">Gửi yêu cầu</button>
        </form>

        <div className="space-y-3 lg:col-span-3">
          {tickets.length === 0 && (
            <div className="card p-8 text-center text-sm text-slate-500">Bạn chưa có yêu cầu hỗ trợ nào.</div>
          )}
          {tickets.map((t) => {
            const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.OPEN;
            return (
              <Link key={t.id} href={`/portal/ho-tro/${t.id}`} className="card group block p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-bold text-slate-900 group-hover:text-brand-700">{t.subject}</div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{t.messages[0]?.body ?? ""}</p>
                <div className="mt-2 text-xs text-slate-400">Cập nhật {formatDate(t.updatedAt)} · Tạo {formatDate(t.createdAt)}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
