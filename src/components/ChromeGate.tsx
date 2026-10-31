"use client";

import { usePathname } from "next/navigation";

// Cau truc chrome CHOT cua chu dao:
// - Trang chu + Dashboard khach (/portal): CHUNG header/menu/footer web chinh.
// - Quan tri (/admin): shell RIENG (header, menu, footer rieng) -> an chrome chinh.
// Dung usePathname (client) thay vi header x-pathname o layout goc, vi layout goc
// KHONG render lai khi dieu huong mem (Link) -> header cong cong bi "dinh" lai.
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
