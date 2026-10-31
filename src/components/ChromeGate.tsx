"use client";

import { usePathname } from "next/navigation";

// An header/footer web chinh khi dang o /admin hoac /portal (2 khu vuc nay co
// shell rieng). Dung usePathname (client) thay vi header x-pathname o layout goc,
// vi layout goc KHONG render lai khi dieu huong mem (Link) -> header cong cong
// bi "dinh" lai khi tu trang chu bam sang Dashboard (loi 2 header).
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/portal")) return null;
  return <>{children}</>;
}
