import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, TICKET_STATUS } from "@/lib/utils";
import { replyTicketAction, setTicketStatusAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Chi tiet 1 yeu cau ho tro (phia khach): luong trao doi + tra loi
export default async function PortalTicketDetail({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; loi?: string } }) {
  const user = await requireUser();
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket || ticket.userId !== user.id) notFound();
  const st = TICKET_STATUS[ticket.status] ?? TICKET_STATUS.OPEN;

  return (
    <div>
      <Link href="/portal/ho-tro" className="text-sm font-medium text-brand-700 hover:underline">← Quay lại Hỗ trợ</Link>
      {searchParams.ok && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchParams.ok}</div>}
      {searchParams.loi && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">{ticket.subject}</h1>
            <p className="mt-1 text-sm text-slate-500">Tạo {formatDate(ticket.createdAt)} · Cập nhật {formatDate(ticket.updatedAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
            {ticket.status !== "CLOSED" && (
              <form action={setTicketStatusAction}>
                <input type="hidden" name="ticketId" value={ticket.id} />
                <input type="hidden" name="status" value="CLOSED" />
                <button className="btn-ghost !px-3 !py-1.5 text-xs">Đóng yêu cầu</button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {ticket.messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "USER" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                m.sender === "USER" ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-700"
              }`}>
                <div className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${m.sender === "USER" ? "text-brand-100" : "text-slate-400"}`}>
                  {m.sender === "USER" ? "Bạn" : "Đội hỗ trợ"} · {formatDate(m.createdAt)}
                </div>
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        {ticket.status !== "CLOSED" ? (
          <form action={replyTicketAction} className="mt-6 border-t pt-5">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <label className="label">Trả lời đội hỗ trợ</label>
            <textarea name="body" required rows={4} className="input" placeholder="Nhập nội dung..." />
            <button className="btn-primary mt-3">Gửi trả lời</button>
          </form>
        ) : (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Yêu cầu này đã đóng. Nếu vẫn cần giúp, hãy tạo yêu cầu mới ở mục Hỗ trợ.</p>
        )}
      </div>
    </div>
  );
}
