"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";

export type AppMenuUser = { name: string; email: string; role: string } | null;
export type AppMenuBadges = { support?: number; orders?: number };

const PUBLIC_NAV = [
  { href: "/", label: "Trang chủ", icon: "fa-house" },
  { href: "/mau", label: "Kho mẫu website", icon: "fa-layer-group" },
  { href: "/bang-gia", label: "Bảng giá", icon: "fa-tags" },
  { href: "/tin-tuc", label: "Tin tức", icon: "fa-newspaper" },
  { href: "/#cach-hoat-dong", label: "Cách hoạt động", icon: "fa-diagram-project" },
  { href: "/#faq", label: "Hỏi đáp", icon: "fa-circle-question" },
];

const DASHBOARD_NAV = [
  { href: "/portal", label: "Tổng quan Dashboard", icon: "fa-gauge-high" },
  { href: "/portal/website", label: "Website của tôi", icon: "fa-globe" },
  { href: "/portal/don-thue", label: "Đơn thuê & gia hạn", icon: "fa-receipt" },
  { href: "/portal/ho-tro", label: "Hỗ trợ", icon: "fa-headset", badgeKey: "support" as const },
  { href: "/portal/ho-so", label: "Hồ sơ & bảo mật", icon: "fa-user-gear" },
];

type NavItem = { href: string; label: string; icon: string; badgeKey?: "support" | "orders" };

function itemActive(pathname: string, href: string) {
  if (href.startsWith("/#") || href === "/") return pathname === href;
  if (href === "/portal" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// === MENU BURGER cua TRANG CHU + DASHBOARD KHACH ===
// Hai khu nay CHUNG mot nha: cung header web chinh, cung menu nay.
// Rieng khu Quan tri (/admin) co shell va menu burger RIENG (AdminMenu).
export default function AppMenu({
  brandName, user, badges,
}: {
  brandName: string;
  user: AppMenuUser;
  badges?: AppMenuBadges;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  const renderItem = (item: NavItem) => {
    const active = itemActive(pathname, item.href);
    const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <i className={`fa-solid ${item.icon} w-5 text-center ${active ? "text-white" : "text-slate-400"}`} aria-hidden />
        <span className="flex-1">{item.label}</span>
        {badge ? (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-white/25 text-white" : "bg-red-100 text-red-600"}`}>{badge}</span>
        ) : null}
      </Link>
    );
  };

  const sectionTitle = (text: string) => (
    <div className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 first:pt-1">{text}</div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        aria-label="Mở menu"
        aria-expanded={open}
      >
        <i className="fa-solid fa-bars text-lg" aria-hidden />
      </button>

      {/* Portal ra document.body: header co backdrop-blur se "nhot" position:fixed
          ben trong khung header (loi drawer vo nua chung) — portal thoat ra ngoai. */}
      {open && createPortal(
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[330px] max-w-[88vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-black text-white shadow-md shadow-brand-600/30">
                {brandName.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 truncate text-base font-black tracking-tight text-slate-900">{brandName}</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Đóng menu"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
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

                  {sectionTitle("Dashboard của tôi")}
                  <div className="space-y-1">{DASHBOARD_NAV.map(renderItem)}</div>

                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white transition hover:bg-slate-800">
                      <i className="fa-solid fa-shield-halved text-lg text-brand-300" aria-hidden />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block font-bold">Vào khu vực quản trị</span>
                        <span className="block text-xs text-slate-300">Khu Admin riêng biệt — quản lý toàn hệ thống</span>
                      </span>
                      <i className="fa-solid fa-arrow-right text-slate-400" aria-hidden />
                    </Link>
                  )}

                  {sectionTitle("Khám phá")}
                  <div className="space-y-1">{PUBLIC_NAV.map(renderItem)}</div>
                </>
              ) : (
                <>
                  {sectionTitle("Khám phá")}
                  <div className="space-y-1">{PUBLIC_NAV.map(renderItem)}</div>
                  <div className="mt-5 grid grid-cols-2 gap-2 px-1">
                    <Link href="/dang-nhap" className="btn-ghost !rounded-xl py-2.5">Đăng nhập</Link>
                    <Link href="/dang-ky" className="btn-primary !rounded-xl py-2.5">Đăng ký</Link>
                  </div>
                </>
              )}
            </div>

            {user && (
              <form action={logoutAction} className="border-t border-slate-100 p-3">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                  <i className="fa-solid fa-right-from-bracket w-5 text-center" aria-hidden />
                  Đăng xuất
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
