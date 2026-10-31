"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SupportChat from "./SupportChat";
import AdminMenu from "./AdminMenu";
import type { AppMenuBadges } from "./AppMenu";

export type ShellMenuItem = { href: string; label: string; icon: string; badge?: number };
export type ShellUser = { name: string; email: string; role: string };

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/portal") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// Shell RIENG cua khu Quan tri (/admin): header + sidebar desktop + footer
// rieng, va menu burger la AdminMenu — menu RIENG chi chua muc quan tri,
// khong lan Dashboard khach hay trang chu. (Dashboard khach /portal khong
// dung shell nay — no hoa vao trang chu, dung AppMenu o header web chinh.)
export default function ShellFrame({
  brand, brandSub, user, menu, footerText, sideExtra, badges, children,
}: {
  brand: string;
  brandSub: string;
  user: ShellUser;
  menu: ShellMenuItem[];
  footerText: string;
  sideExtra?: React.ReactNode;
  badges?: AppMenuBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const initial = (user.name || "?").trim().charAt(0).toUpperCase();
  const userSub = user.role === "ADMIN" ? `Quản trị viên · ${user.email}` : user.email;

  const nav = (
    <nav className="space-y-1">
      {menu.map((m) => {
        const active = isActive(pathname, m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white">{initial}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{user.name}</span>
        <span className="block truncate text-xs text-slate-500">{userSub}</span>
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* ===== Header rieng cua khu Quan tri (menu burger AdminMenu rieng) ===== */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <AdminMenu brandName={brand} user={user} badges={badges} />
          <Link href={menu[0]?.href ?? "/"} className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
              <i className="fa-solid fa-globe" aria-hidden />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-black text-slate-900">{brand}</span>
              <span className="block truncate text-xs text-slate-500">{brandSub}</span>
            </span>
          </Link>
          <div className="ml-auto hidden shrink-0 items-center gap-2.5 md:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">{initial}</span>
            <span className="max-w-[160px] truncate text-sm font-semibold text-slate-800">{user.name}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-stretch">
        {/* ===== Sidebar desktop ===== */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
          <div className="mb-4 rounded-2xl bg-slate-50 p-3">{userBox}</div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          {sideExtra}
        </aside>

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
