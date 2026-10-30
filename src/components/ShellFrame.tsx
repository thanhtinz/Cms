"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import SupportChat from "./SupportChat";

export type ShellMenuItem = { href: string; label: string; icon: string; badge?: number };

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/portal") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// Khung dung chung cho Dashboard khach va trang Quan tri:
// header rieng + sidebar (desktop) / drawer (mobile, nut burger) + footer rieng.
export default function ShellFrame({
  brand, brandSub, userName, userSub, menu, footerText, sideExtra, children,
}: {
  brand: string;
  brandSub: string;
  userName: string;
  userSub: string;
  menu: ShellMenuItem[];
  footerText: string;
  sideExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = (userName || "?").trim().charAt(0).toUpperCase();

  const nav = (onClick?: () => void) => (
    <nav className="space-y-1">
      {menu.map((m) => {
        const active = isActive(pathname, m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <i className={`fa-solid ${m.icon} w-5 text-center ${active ? "text-white" : "text-slate-400"}`} aria-hidden />
            <span className="flex-1">{m.label}</span>
            {m.badge ? (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-white/25 text-white" : "bg-red-100 text-red-600"}`}>{m.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const userBox = (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white">{initial}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{userName}</span>
        <span className="block truncate text-xs text-slate-500">{userSub}</span>
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* ===== Header rieng cua khu vuc ===== */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <i className="fa-solid fa-bars text-lg" aria-hidden />
          </button>
          <Link href={menu[0]?.href ?? "/"} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
              <i className="fa-solid fa-globe" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-black text-slate-900">{brand}</span>
              <span className="block text-xs text-slate-500">{brandSub}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link href="/" className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex">
              <i className="fa-solid fa-arrow-up-right-from-square text-xs" aria-hidden /> Xem website
            </Link>
            <div className="hidden md:block">{userBox}</div>
            <form action={logoutAction}>
              <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700" title="Đăng xuất">
                <i className="fa-solid fa-right-from-bracket" aria-hidden />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-stretch">
        {/* ===== Sidebar desktop ===== */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
          <div className="mb-4 rounded-2xl bg-slate-50 p-3">{userBox}</div>
          <div className="flex-1 overflow-y-auto">{nav()}</div>
          {sideExtra}
        </aside>

        {/* ===== Drawer mobile (menu burger) ===== */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-black text-slate-900">{brand}</span>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200" onClick={() => setOpen(false)} aria-label="Đóng menu">
                  <i className="fa-solid fa-xmark" aria-hidden />
                </button>
              </div>
              <div className="mb-4 rounded-2xl bg-slate-50 p-3">{userBox}</div>
              <div className="flex-1 overflow-y-auto">{nav(() => setOpen(false))}</div>
              {sideExtra}
            </div>
          </div>
        )}

        {/* ===== Noi dung + footer rieng ===== */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
          <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-400 sm:px-6">{footerText}</footer>
        </div>
      </div>

      <SupportChat />
    </div>
  );
}
