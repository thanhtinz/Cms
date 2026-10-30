import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";

// Toan bo nen tang doc du lieu dong (cai dat, nguoi dung) — khong prerender tinh.
export const dynamic = "force-dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toasts from "@/components/Toast";
import { getSettings } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `${s.brandName} — Thuê website theo mẫu, tự động tạo web`,
    description: s.heroSubtitle,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // /admin va /portal co shell rieng (header/footer/menu cua chinh no)
  const pathname = headers().get("x-pathname") ?? "";
  const isAppShell = pathname.startsWith("/admin") || pathname.startsWith("/portal");
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {isAppShell ? (
          children
        ) : (
          <>
            <Header />
            <main className="min-h-[70vh]">{children}</main>
            <Footer />
          </>
        )}
        <Suspense fallback={null}>
          <Toasts />
        </Suspense>
      </body>
    </html>
  );
}
