import { getSettings, setSettings } from './settings';

// ── Ket noi nen tang ThueWeb ─────────────────────────────────────────────
// Ban cai nay cua Digital Store duoc dung lam MAU WEBSITE CHO THUE tren nen
// tang ThueWeb. Moi lan thue, nen tang cap cho khach mot KEY KICH HOAT rieng
// (dang TW-XXXXXX-XXXXXX-XXXXXX). Sau khi dung xong ban cai cho khach, mo
// Admin → Settings → Platform, nhap dia chi nen tang + key + ten mien cua
// cua hang roi bam Activate: cua hang goi POST /api/kich-hoat-website cua
// nen tang de danh dau key da kich hoat (trang thai hien cong khai o trang
// Kiem tra key cua nen tang). Co the khai san bang bien moi truong
// THUEWEB_API_URL / THUEWEB_LICENSE_KEY / THUEWEB_DOMAIN (env luon thang DB).

export async function getPlatformConfig() {
  const s = await getSettings([
    'platform_api_url',
    'platform_license_key',
    'platform_domain',
    'platform_activated_at',
  ]);
  return {
    apiUrl: (s.platform_api_url || '').replace(/\/$/, ''),
    licenseKey: s.platform_license_key || '',
    domain: s.platform_domain || '',
    activatedAt: s.platform_activated_at || '',
  };
}

export async function activatePlatform(): Promise<{ ok: boolean; message: string }> {
  const cfg = await getPlatformConfig();
  if (!cfg.apiUrl) return { ok: false, message: 'Platform URL is not configured yet' };
  if (!cfg.licenseKey) return { ok: false, message: 'License key is empty — the customer receives it in the platform Dashboard' };
  if (!cfg.domain) return { ok: false, message: "This store's domain is empty" };
  try {
    const res = await fetch(`${cfg.apiUrl}/api/kich-hoat-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: cfg.licenseKey, domain: cfg.domain }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) {
      await setSettings({ platform_activated_at: new Date().toISOString() });
      return {
        ok: true,
        message: data.alreadyActivated
          ? 'This key was already activated before — the connection is still valid'
          : 'Activated! The platform has recorded this store as live',
      };
    }
    return { ok: false, message: data?.message || `The platform returned HTTP ${res.status}` };
  } catch {
    return { ok: false, message: 'Could not reach the platform — check the Platform URL and try again' };
  }
}
