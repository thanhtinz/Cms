"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import type { AppMenuUser, AppMenuBadges } from "./AppMenu";

// === MENU BURGER RIENG CUA KHU QUAN TRI ===
// Admin la khu vuc RIENG BIET: header rieng, menu rieng, footer rieng.
// Drawer nay CHI chua muc quan tri — khong lan Dashboard khach hay trang chu.
// (Trang chu + Dashboard khach dung AppMenu chung; chi khu /admin dung cai nay.)

const ADMIN_NAV = [
  { href: "/admin", label: "Tổng quan quản trị", icon: "fa-gauge-high" },
  { href: "/admin/don-thue", label: "Đơn thuê", icon: "fa-receipt", badgeKey: "orders" as const },
  { href: "/admin/website", label: "Website khách", icon: "fa-globe" },
  { href: "/admin/khach-hang", label: "Khách hàng", icon: "fa-users" },
  { href: "/admin/ho-tro", label: "Hỗ trợ khách hàng", icon: "fa-headset", badgeKey: "support" as const },
  { href: "/admin/mau", label: "Mẫu website", icon: "fa-layer-group" },
  { href: "/admin/goi-thoi-gian", label: "Gói thời gian", icon: "fa-box-open" },
  { href: "/admin/voucher", label: "Voucher giảm giá", icon: "fa-ticket" },
  { href: "/admin/tin-tuc", label: "Tin tức", icon: "fa-newspaper" },
  { href: "/admin/faq", label: "FAQ", icon: "fa-circle-question" },
  { href: "/admin/nhat-ky", label: "Nhật ký hoạt động", icon: "fa-clock-rotate-left" },
  { href: "/admin/cai-dat", label: "Cài đặt hệ thống", icon: "fa-gear" },
];

type NavItem = { href: string; label: string; icon: string; badgeKey?: "support" | "orders" };

function itemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminMenu({
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        aria-label="Mở menu quản trị"
        aria-expanded={open}
      >
        <i className="fa-solid fa-bars text-lg" aria-hidden />
      </button>

      {/* Portal ra document.body nhu AppMenu (tranh header backdrop-blur nhot fixed) */}
      {open && createPortal(
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[330px] max-w-[88vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 font-black text-white shadow-md">
                {brandName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-base font-black tracking-tight text-slate-900">{brandName}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Khu vực quản trị</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Đóng menu"
              >
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {user && (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold">{initial}</span>
                  <div className="min-w-0 leading-tight">
                    <div className="truncate font-bold">{user.name}</div>
                    <div className="truncate text-xs text-slate-300">{user.email}</div>
                    <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">Quản trị viên</span>
                  </div>
                </div>
              )}

              <div className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Quản trị hệ thống</div>
              <div className="space-y-1">{ADMIN_NAV.map(renderItem)}</div>

              <div className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ra ngoài</div>
              <div className="space-y-1">
                <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                  <i className="fa-solid fa-arrow-up-right-from-square w-5 text-center text-slate-400" aria-hidden />
                  <span className="flex-1">Xem trang web</span>
                </Link>
              </div>
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
