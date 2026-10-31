import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, getSettings } from "@/lib/db";
import { formatVND, formatDate, ORDER_STATUS, SITE_STATUS } from "@/lib/utils";
import { confirmPaymentAction, cancelOrderAction, activateSiteAction, setSiteStatusAction, saveOrderNoteAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string } }) {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: params.id },
    include: { user: true, template: true, plan: true, timePackage: true, site: true },
  });
  if (!order) notFound();
  const s = await getSettings();
  const site = order.site;
  return (
    <div>
      <Link href="/admin/don-thue" className="text-sm text-brand-700 hover:underline">← Danh sách đơn thuê</Link>
      <h1 className="mt-2 text-2xl font-bold">Đơn {order.code}</h1>
      {searchParams.ok && <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{searchParams.ok}</div>}

      <div className="card mt-5 grid gap-4 p-6 text-sm sm:grid-cols-2">
        <div><span className="text-slate-500">Khách hàng:</span> <b>{order.user.name}</b> · {order.user.email}{order.user.phone ? ` · ${order.user.phone}` : ""}</div>
        <div><span className="text-slate-500">Trạng thái đơn:</span> <b>{ORDER_STATUS[order.status] ?? order.status}</b>{order.paidAt ? ` · đã thu ${formatDate(order.paidAt)}` : ""}</div>
        <div><span className="text-slate-500">Mẫu:</span> <b>{order.template.name}</b> (src: sites/{order.template.folderSlug ?? "—"})</div>
        <div><span className="text-slate-500">Gói:</span> <b>{order.planName}</b>{order.timePackageId
          ? <> — gói thời gian {order.durationMonths} tháng, trọn gói {order.subtotal > 0 ? formatVND(order.subtotal) : formatVND(order.total + order.voucherDiscount)}</>
          : <> — {formatVND(order.planPriceMonth)}/tháng × {order.durationMonths} tháng{order.discountPercent > 0 ? ` −${order.discountPercent}%` : ""} <span className="text-slate-400">(đơn theo mô hình cũ)</span></>}</div>
        {order.voucherCode && (
          <div><span className="text-slate-500">Voucher:</span> <b className="font-mono">{order.voucherCode}</b> — giảm {formatVND(order.voucherDiscount)}{order.subtotal > 0 ? ` (tính trên ${formatVND(order.subtotal)})` : ""}</div>
        )}
        <div><span className="text-slate-500">Tên website:</span> <b>{order.siteName}</b></div>
        <div><span className="text-slate-500">Tên miền khách:</span> <b>{order.domain}</b></div>
        <div><span className="text-slate-500">Tổng tiền:</span> <b className="text-brand-700">{formatVND(order.total)}</b></div>
        <div><span className="text-slate-500">Ngày đặt:</span> <b>{formatDate(order.createdAt)}</b></div>
        {order.note && <div className="sm:col-span-2"><span className="text-slate-500">Ghi chú của khách:</span> <b>{order.note}</b></div>}
      </div>

      <div className="card mt-5 p-6">
        <h2 className="font-bold"><i className="fa-solid fa-note-sticky mr-2 text-amber-500" aria-hidden /> Ghi chú nội bộ</h2>
        <p className="mt-1 text-xs text-slate-400">Chỉ đội quản trị thấy — khách hàng không bao giờ thấy ghi chú này. Dùng để lưu ý đối soát, thỏa thuận riêng, lịch sử xử lý đơn...</p>
        <form action={saveOrderNoteAction} className="mt-3">
          <input type="hidden" name="orderId" value={order.id} />
          <textarea name="adminNote" rows={3} defaultValue={order.adminNote ?? ""} placeholder="Ví dụ: Khách chuyển khoản từ tài khoản khác, đã gọi điện xác nhận lúc 9h..." className="input w-full" />
          <button className="btn-primary mt-3">Lưu ghi chú</button>
        </form>
      </div>

      {order.status === "CHO_THANH_TOAN" && (
        <div className="card mt-5 flex flex-wrap items-center gap-3 p-5">
          <div className="text-sm">Đã nhận được tiền chuyển khoản với nội dung <b>{order.code}</b>?</div>
          <form action={confirmPaymentAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button className="btn-primary">Xác nhận thanh toán → Tạo website tự động</button>
          </form>
          <form action={cancelOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button className="btn-danger">Huỷ đơn</button>
          </form>
        </div>
      )}

      {site && (
        <div className="card mt-5 p-6">
          <h2 className="font-bold">Website đã tạo từ đơn này</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Tên miền tạm</dt><dd className="font-medium">{site.slug}.{s.platformDomain}</dd></div>
            <div><dt className="text-slate-500">Trạng thái</dt><dd><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(SITE_STATUS[site.status] ?? SITE_STATUS.HET_HAN).color}`}>{(SITE_STATUS[site.status] ?? SITE_STATUS.HET_HAN).label}</span></dd></div>
            <div><dt className="text-slate-500">Ngày kích hoạt</dt><dd className="font-medium">{formatDate(site.startedAt)}</dd></div>
            <div><dt className="text-slate-500">Ngày hết hạn</dt><dd className="font-medium">{formatDate(site.expiresAt)}</dd></div>
            <div><dt className="text-slate-500">Token DNS của khách</dt><dd className="font-mono text-xs">{site.dnsToken}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {site.status === "CHO_TRO_DNS" && (
              <form action={activateSiteAction}>
                <input type="hidden" name="siteId" value={site.id} />
                <input type="hidden" name="back" value={`/admin/don-thue/${order.id}`} />
                <button className="btn-primary">Kích hoạt — khách đã trỏ DNS xong (hạn thuê tính từ hôm nay)</button>
              </form>
            )}
            {site.status === "DANG_HOAT_DONG" && (
              <form action={setSiteStatusAction}>
                <input type="hidden" name="siteId" value={site.id} />
                <input type="hidden" name="status" value="TAM_NGUNG" />
                <input type="hidden" name="back" value={`/admin/don-thue/${order.id}`} />
                <button className="btn-danger">Tạm ngưng website</button>
              </form>
            )}
            {site.status === "TAM_NGUNG" && (
              <form action={setSiteStatusAction}>
                <input type="hidden" name="siteId" value={site.id} />
                <input type="hidden" name="status" value="DANG_HOAT_DONG" />
                <input type="hidden" name="back" value={`/admin/don-thue/${order.id}`} />
                <button className="btn-primary">Mở lại website</button>
              </form>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-400">Khách tự làm các bước DNS trong trang quản lý của họ; ở bản MVP này admin bấm Kích hoạt sau khi kiểm tra tên miền đã trỏ đúng (khách có nút tự kiểm tra trong portal của họ). Tích hợp Cloudflare for SaaS API để tự kích hoạt nằm ở giai đoạn tiếp theo.</p>
        </div>
      )}
    </div>
  );
}
