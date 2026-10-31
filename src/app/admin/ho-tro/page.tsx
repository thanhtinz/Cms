import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, TICKET_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "Tất cả" },
  { key: "OPEN", label: "Chờ phản hồi" },
  { key: "ANSWERED", label: "Đã phản hồi" },
  { key: "CLOSED", label: "Đã đóng" },
];

// Admin: danh sach yeu cau ho tro cua khach
export default async function AdminSupportPage({ searchParams }: { searchParams: { tt?: string } }) {
  const tt = searchParams.tt ?? "";
  const tickets = await prisma.supportTicket.findMany({
    where: FILTERS.some((f) => f.key === tt && tt) ? { status: tt } : {},
    include: { user: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900">Hỗ trợ khách hàng</h1>
      <p className="mt-1 text-slate-500">Các yêu cầu khách gửi từ Dashboard — bấm vào để trả lời. Trợ lý AI đã xử lý các câu hỏi thường gặp, ticket là phần cần người thật.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/admin/ho-tro?tt=${f.key}` : "/admin/ho-tro"}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${tt === f.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {tickets.map((t) => {
          const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.OPEN;
          return (
            <Link key={t.id} href={`/admin/ho-tro/${t.id}`} className="card group block p-5 transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{t.user.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-brand-700">{t.subject}</div>
                    <div className="text-xs text-slate-400">{t.user.name} · {t.user.email} · Cập nhật {formatDate(t.updatedAt)}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{t.messages[0]?.body ?? ""}</p>
            </Link>
          );
        })}
        {tickets.length === 0 && <div className="card p-8 text-center text-sm text-slate-500">Không có yêu cầu nào ở mục này.</div>}
      </div>
    </div>
  );
}
