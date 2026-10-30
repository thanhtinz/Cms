import type { Metadata } from "next";
import "./globals.css";

// Toan bo nen tang doc du lieu dong (cai dat, nguoi dung) — khong prerender tinh.
export const dynamic = "force-dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `${s.brandName} — Thuê website theo mẫu, tự động tạo web`,
    description: s.heroSubtitle,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
