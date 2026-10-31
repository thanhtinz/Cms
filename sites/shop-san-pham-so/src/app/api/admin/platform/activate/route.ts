import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handler } from '@/lib/api';
import { activatePlatform } from '@/lib/platform';

export const dynamic = 'force-dynamic';

// POST — kich hoat ban cai nay voi nen tang ThueWeb bang key khach duoc cap
// (Admin → Settings → Platform). Nen tang kiem tra key + ten mien, danh dau
// keyActivatedAt va tra thong tin website/goi thue.
export const POST = handler(async () => {
  await requireAdmin();
  const res = await activatePlatform();
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
});
