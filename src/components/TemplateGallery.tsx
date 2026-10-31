"use client";

import { useCallback, useRef, useState } from "react";

// Khung anh mau co nut bam qua/lai, dem so anh, anh thu nho va vuot de
// chuyen anh tren dien thoai.
export default function TemplateGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  const go = useCallback((dir: number) => setI((v) => (v + dir + n) % n), [n]);

  if (n === 0) {
    return (
      <div className="card flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-brand-100 to-slate-200 text-5xl font-black text-brand-300">
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div
        className="card relative overflow-hidden"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={name} className="aspect-[16/10] w-full object-cover" />
        {n > 1 && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-base text-slate-700 shadow-lg transition hover:bg-white"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Ảnh tiếp theo"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-base text-slate-700 shadow-lg transition hover:bg-white"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">
              {i + 1} / {n}
            </span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className={`mt-3 grid gap-3 ${n >= 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {images.map((g, idx) => (
            <button
              key={g}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Xem ảnh ${idx + 1}`}
              className={`overflow-hidden rounded-2xl transition ring-2 ${idx === i ? "ring-brand-600" : "opacity-70 ring-transparent hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt="" className="aspect-[16/10] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
