import Link from "next/link";
import { getSettings } from "@/lib/db";

export default async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="font-bold text-slate-900">{s.brandName}</div>
          <p className="mt-2 text-sm text-slate-500">
            Nền tảng cho thuê website theo mẫu. Chọn mẫu — chọn gói — nhập tên miền, hệ thống tự tạo web cho bạn.
          </p>
        </div>
        <div>
          <div className="font-semibold text-sm">Sản phẩm</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            <li><Link href="/mau" className="hover:text-brand-700">Kho mẫu website</Link></li>
            <li><Link href="/tin-tuc" className="hover:text-brand-700">Tin tức & hướng dẫn</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-sm">Tài khoản</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            <li><Link href="/dang-nhap" className="hover:text-brand-700">Đăng nhập</Link></li>
            <li><Link href="/dang-ky" className="hover:text-brand-700">Đăng ký</Link></li>
            <li><Link href="/portal" className="hover:text-brand-700">Web của tôi</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-sm">Hỗ trợ</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            <li>Email: {s.supportEmail}</li>
            {s.supportPhone && <li>Hotline: {s.supportPhone}</li>}
            {s.zaloUrl && <li><a href={s.zaloUrl} className="hover:text-brand-700">Chat Zalo</a></li>}
          </ul>
        </div>
      </div>
      {s.footerText && (
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">{s.footerText}</div>
      )}
    </footer>
  );
}
