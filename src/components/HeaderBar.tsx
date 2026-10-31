"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";

type UserLite = { name: string; email: string; role: string } | null;

const PUBLIC_NAV = [
  { href: "/mau", label: "Kho mẫu", icon: "fa-layer-group" },
  { href: "/bang-gia", label: "Bảng giá", icon: "fa-tags" },
  { href: "/tin-tuc", label: "Tin tức", icon: "fa-newspaper" },
  { href: "/#cach-hoat-dong", label: "Cách hoạt động", icon: "fa-diagram-project" },
  { href: "/#faq", label: "Hỏi đáp", icon: "fa-circle-question" },
];

const DASHBOARD_NAV = [
  { href: "/portal", label: "Tổng quan Dashboard", icon: "fa-gauge-high" },
  { href: "/portal/website", label: "Website của tôi", icon: "fa-globe" },
  { href: "/portal/don-thue", label: "Đơn thuê & gia hạn", icon: "fa-receipt" },
  { href: "/portal/ho-tro", label: "Hỗ trợ", icon: "fa-headset" },
  { href: "/portal/ho-so", label: "Hồ sơ & bảo mật", icon: "fa-user-gear" },
];

// Header web chinh: sau dang nhap, Dashboard "hoa" vao trang chu —
// avatar + nut burger mo menu dieu huong toi moi trang (khong con nut hop xau).
export default function HeaderBar({
  brandName, logoUrl, user,
}: {
  brandName: string; logoUrl: string | null; user: UserLite;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();
  const isActive = (href: string) => href.startsWith("/#") ? false : pathname === href || pathname.startsWith(href + "/");

  const menuLink = (item: { href: string; label: string; icon: string }) => (
    <Link
      key={item.href}
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <i className={`fa-solid ${item.icon} w-5 text-center ${isActive(item.href) ? "text-brand-600" : "text-slate-400"}`} aria-hidden />
      {item.label}
      <i className="fa-solid fa-chevron-right ml-auto text-[10px] text-slate-300" aria-hidden />
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-6">
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
            <>
              <Link href="/portal/website" className="hidden items-center gap-2 rounded-full bg-slate-900 py-2 pl-2 pr-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 md:inline-flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold">{initial}</span>
                <span className="max-w-[140px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={() => setOpen((v) => !v)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  open ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                aria-label="Mở menu"
                aria-expanded={open}
              >
                <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"} text-lg`} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <Link href="/dang-nhap" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:block">
                Đăng nhập
              </Link>
              <Link href="/dang-ky" className="btn-primary hidden !rounded-xl px-4 py-2.5 sm:inline-flex">
                Đăng ký miễn phí
              </Link>
              <button
                onClick={() => setOpen((v) => !v)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition lg:hidden ${
                  open ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                aria-label="Mở menu"
                aria-expanded={open}
              >
                <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"} text-lg`} aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== Menu burger ===== */}
      {open && (
        <>
          <div className="fixed inset-0 top-16 z-30 bg-slate-900/30 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-full z-40 px-3 pb-3 sm:inset-x-auto sm:right-4 sm:w-[380px] sm:px-0">
            <div className="max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold">{initial}</span>
                    <div className="min-w-0 leading-tight">
                      <div className="truncate font-bold">{user.name}</div>
                      <div className="truncate text-xs text-slate-300">{user.email}</div>
                      <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                        {user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-0.5">
                    <div className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Dashboard của tôi</div>
                    {DASHBOARD_NAV.map(menuLink)}
                  </div>

                  {user.role === "ADMIN" && (
                    <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
                      <Link href="/admin" className="flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                        <i className="fa-solid fa-screwdriver-wrench w-5 text-center" aria-hidden />
                        Quản trị hệ thống
                        <i className="fa-solid fa-chevron-right ml-auto text-[10px] text-slate-400" aria-hidden />
                      </Link>
                    </div>
                  )}

                  <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 lg:hidden">
                    <div className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Khám phá</div>
                    {PUBLIC_NAV.map(menuLink)}
                  </div>

                  <form action={logoutAction} className="mt-2 border-t border-slate-100 pt-2">
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                      <i className="fa-solid fa-right-from-bracket w-5 text-center" aria-hidden />
                      Đăng xuất
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    {PUBLIC_NAV.map(menuLink)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <Link href="/dang-nhap" className="btn-ghost !rounded-xl py-2.5">Đăng nhập</Link>
                    <Link href="/dang-ky" className="btn-primary !rounded-xl py-2.5">Đăng ký</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
