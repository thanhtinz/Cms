import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, TICKET_STATUS } from "@/lib/utils";
import { adminReplyTicketAction, setTicketStatusAction } from "@/lib/actions";
import AiDraftButton from "@/components/admin/AiDraftButton";

export const dynamic = "force-dynamic";

// Admin: chi tiet ticket — tra loi khach + doi trang thai
export default async function AdminTicketDetail({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; loi?: string } }) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: { user: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();
  const st = TICKET_STATUS[ticket.status] ?? TICKET_STATUS.OPEN;

  return (
    <div>
      <Link href="/admin/ho-tro" className="text-sm font-medium text-brand-700 hover:underline">← Quay lại Hỗ trợ khách hàng</Link>
      {searchParams.ok && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchParams.ok}</div>}
      {searchParams.loi && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">{ticket.subject}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Khách: <b className="text-slate-700">{ticket.user.name}</b> · {ticket.user.email}{ticket.user.phone ? ` · ${ticket.user.phone}` : ""} · Tạo {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
            {ticket.status !== "CLOSED" ? (
              <form action={setTicketStatusAction}>
                <input type="hidden" name="ticketId" value={ticket.id} />
                <input type="hidden" name="status" value="CLOSED" />
                <button className="btn-ghost !px-3 !py-1.5 text-xs">Đóng ticket</button>
              </form>
            ) : (
              <form action={setTicketStatusAction}>
                <input type="hidden" name="ticketId" value={ticket.id} />
                <input type="hidden" name="status" value="OPEN" />
                <button className="btn-ghost !px-3 !py-1.5 text-xs">Mở lại</button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {ticket.messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "ADMIN" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                m.sender === "ADMIN" ? "rounded-br-md bg-slate-900 text-white" : "rounded-bl-md bg-slate-100 text-slate-700"
              }`}>
                <div className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${m.sender === "ADMIN" ? "text-slate-300" : "text-slate-400"}`}>
                  {m.sender === "ADMIN" ? "Đội hỗ trợ (bạn)" : ticket.user.name} · {formatDate(m.createdAt)}
                </div>
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        {ticket.status !== "CLOSED" && (
          <form action={adminReplyTicketAction} className="mt-6 border-t pt-5">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <label className="label">Trả lời khách hàng</label>
            <textarea id="admin-reply-box" name="body" required rows={4} className="input" placeholder="Nhập nội dung phản hồi..." />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button className="btn-primary">Gửi trả lời</button>
              <AiDraftButton ticketId={ticket.id} targetId="admin-reply-box" />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
