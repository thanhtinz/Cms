"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppMenu, { type AppMenuUser, type AppMenuBadges } from "./AppMenu";

const PUBLIC_NAV = [
  { href: "/mau", label: "Kho mẫu" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/#cach-hoat-dong", label: "Cách hoạt động" },
  { href: "/#faq", label: "Hỏi đáp" },
];

// Header web chinh — dieu huong duy nhat la AppMenu (dung chung ca he thong).
export default function HeaderBar({
  brandName, logoUrl, user, badges,
}: {
  brandName: string;
  logoUrl: string | null;
  user: AppMenuUser;
  badges?: AppMenuBadges;
}) {
  const pathname = usePathname() ?? "";

  // Phong thu: khong bao gio xuat hien trong khu vuc Dashboard/Quan tri
  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) return null;

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();
  const isActive = (href: string) => (href.startsWith("/#") ? false : pathname === href || pathname.startsWith(href + "/"));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4">
        <AppMenu brandName={brandName} user={user} badges={badges} />
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName} className="h-9 w-auto" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-black text-white shadow-md shadow-brand-600/30">
              {brandName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-lg font-black tracking-tight text-slate-900">{brandName}</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(n.href) ? "text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <Link href="/portal/website" className="inline-flex items-center gap-2 rounded-full bg-slate-900 py-2 pl-2 pr-3.5 text-sm font-semibold text-white transition hover:bg-slate-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold">{initial}</span>
              <span className="hidden max-w-[140px] truncate sm:inline">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link href="/dang-nhap" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:block">
                Đăng nhập
              </Link>
              <Link href="/dang-ky" className="btn-primary !rounded-xl px-4 py-2.5">
                Đăng ký miễn phí
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
