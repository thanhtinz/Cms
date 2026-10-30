"use client";

import { useState } from "react";

export default function DomainCheckButton({ domain }: { domain: string }) {
  const [result, setResult] = useState<{ messages: string[]; pointsToUs: boolean; onCloudflare: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/kiem-tra-ten-mien", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <button onClick={run} disabled={loading} className="btn-primary">
        {loading ? "Đang kiểm tra DNS..." : "Kiểm tra lại kết nối"}
      </button>
      {result && (
        <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${result.pointsToUs ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          <ul className="list-disc space-y-1 pl-5">
            {result.messages.filter((m) => !m.includes("đã được sử dụng trong hệ thống")).map((m) => <li key={m}>{m}</li>)}
          </ul>
          {result.pointsToUs && <p className="mt-2 font-medium">Tên miền đã trỏ đúng. Hệ thống sẽ kích hoạt website của bạn trong ít phút — nếu sau 1 giờ vẫn chưa kích hoạt, hãy liên hệ hỗ trợ.</p>}
        </div>
      )}
    </div>
  );
}
