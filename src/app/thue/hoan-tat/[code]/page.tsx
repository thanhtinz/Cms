import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, getSettings } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatVND, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDonePage({ params }: { params: { code: string } }) {
  const user = await requireUser();
  const order = await prisma.rentalOrder.findUnique({
    where: { code: params.code },
    include: { template: true, plan: true },
  });
  if (!order || order.userId !== user.id) notFound();
  const s = await getSettings();
  const hasBank = s.bankCode && s.bankAccount;
  const qrUrl = hasBank
    ? `https://img.vietqr.io/image/${s.bankCode}-${s.bankAccount}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(order.code)}&accountName=${encodeURIComponent(s.bankOwner)}`
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="card p-6">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 font-semibold">
          Đã tạo đơn thuê {order.code} thành công
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Mẫu website</dt><dd className="font-medium">{order.template.name}</dd></div>
          <div><dt className="text-slate-500">Gói thuê</dt><dd className="font-medium">{order.planName} — {order.durationMonths} tháng</dd></div>
          {order.voucherCode && (
            <div><dt className="text-slate-500">Voucher đã dùng</dt><dd className="font-medium text-emerald-600">{order.voucherCode} — giảm {formatVND(order.voucherDiscount)}</dd></div>
          )}
          <div><dt className="text-slate-500">Tên website</dt><dd className="font-medium">{order.siteName}</dd></div>
          <div><dt className="text-slate-500">Tên miền</dt><dd className="font-medium">{order.domain}</dd></div>
          <div><dt className="text-slate-500">Ngày đặt</dt><dd className="font-medium">{formatDate(order.createdAt)}</dd></div>
          <div><dt className="text-slate-500">Trạng thái</dt><dd className="font-medium">{order.status === "CHO_THANH_TOAN" ? "Chờ thanh toán" : order.status}</dd></div>
        </dl>

        {order.status === "CHO_THANH_TOAN" && (
          <div className="mt-6 border-t pt-5">
            <h2 className="font-bold">Thanh toán để hệ thống bắt đầu tạo web</h2>
            <div className="mt-1 text-2xl font-black text-brand-700">{formatVND(order.total)}</div>
            {hasBank ? (
              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                {qrUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="VietQR thanh toán" className="w-56 rounded-xl border" />
                )}
                <div className="text-sm leading-relaxed text-slate-600">
                  <p>Ngân hàng: <b>{s.bankCode}</b></p>
                  <p>Số tài khoản: <b>{s.bankAccount}</b></p>
                  <p>Chủ tài khoản: <b>{s.bankOwner}</b></p>
                  <p>Nội dung chuyển khoản: <b className="text-red-600">{order.code}</b></p>
                  <p className="mt-2">Ghi đúng mã đơn ở nội dung chuyển khoản để hệ thống đối soát nhanh. Sau khi admin xác nhận thanh toán, website của bạn được tạo tự động và xuất hiện trong mục Web của tôi.</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Thông tin tài khoản nhận tiền đang được cập nhật. Vui lòng liên hệ {s.supportEmail}
                {s.supportPhone ? ` — ${s.supportPhone}` : ""} kèm mã đơn <b>{order.code}</b> để được hướng dẫn thanh toán.
              </p>
            )}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Link href="/portal" className="btn-primary">Tới Web của tôi</Link>
          <Link href="/mau" className="btn-ghost">Xem thêm mẫu khác</Link>
        </div>
      </div>
    </div>
  );
}
