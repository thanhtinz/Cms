import Link from "next/link";
import { getSettings } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export default async function Header() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.brandName} className="h-8 w-auto" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-black">W</span>
          )}
          {settings.brandName}
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href="/mau" className="hover:text-brand-700">Kho mẫu</Link>
          <Link href="/bang-gia" className="hover:text-brand-700">Bảng giá</Link>
          <Link href="/#cach-hoat-dong" className="hover:text-brand-700">Cách hoạt động</Link>
          <Link href="/#faq" className="hover:text-brand-700">Hỏi đáp</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/admin" className="btn-ghost">Quản trị</Link>}
              <Link href="/portal" className="btn-ghost">Web của tôi</Link>
              <form action={logoutAction}>
                <button className="text-sm text-slate-500 hover:text-red-600 px-2">Đăng xuất</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/dang-nhap" className="btn-ghost">Đăng nhập</Link>
              <Link href="/dang-ky" className="btn-primary">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
