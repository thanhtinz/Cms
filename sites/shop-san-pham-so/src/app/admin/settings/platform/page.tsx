'use client';

import { useState } from 'react';
import { api } from '@/lib/client';
import Icon from '@/components/icons';
import { useSettings, field, SettingsHeader } from '../shared';

// Ket noi ban cai nay voi nen tang ThueWeb (noi khach da thue mau website
// nay): nhap key kich hoat khach nhan trong Dashboard cua nen tang + ten
// mien cua cua hang, bam Activate de nen tang ghi nhan website da song.
export default function AdminPlatformSettingsPage() {
  const { s, set, save, busy, toast } = useSettings();
  const [activating, setActivating] = useState(false);
  if (!s) return <div className="py-16 text-center text-gray-400">Loading settings…</div>;

  const activatedAt = s.platform_activated_at;

  const activate = async () => {
    setActivating(true);
    try {
      await save();
      const d = await api<{ ok: boolean; message: string }>('/api/admin/platform/activate', { method: 'POST', json: {} });
      toast(d.message);
      if (d.ok) window.location.reload();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div>
      <SettingsHeader
        title="Platform (ThuêWeb)"
        subtitle="Connect this store instance to the ThuêWeb rental platform that issued its license key."
        onSave={save}
        busy={busy}
      />

      <div className="card mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold">
            <Icon name="key" className="text-brand-600" />
            License activation
          </h2>
          {activatedAt ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Activated · {new Date(activatedAt).toLocaleString()}
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Not activated yet</span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Every rental on the platform comes with its own activation key (format TW-XXXXXX-XXXXXX-XXXXXX), shown to the
          customer in their platform Dashboard under &quot;Website của tôi&quot;. Enter the platform address, that key and
          this store&apos;s real domain, then activate — the platform verifies the key, marks it as activated and the
          rental clock/status becomes visible on the platform&apos;s public key-check page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {field(s, set, { k: 'platform_api_url', label: 'Platform URL', placeholder: 'https://cms-swart-delta.vercel.app' })}
          {field(s, set, { k: 'platform_domain', label: "This store's domain", placeholder: 'shop.example.vn' })}
          {field(s, set, { k: 'platform_license_key', label: 'License key', placeholder: 'TW-XXXXXX-XXXXXX-XXXXXX' })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={activate} disabled={activating || busy}>
            {activating ? 'Activating…' : activatedAt ? 'Re-activate / verify' : 'Save & activate'}
          </button>
          <span className="text-xs text-gray-400">
            The same values can be pinned at deploy time with the THUEWEB_API_URL / THUEWEB_LICENSE_KEY / THUEWEB_DOMAIN
            environment variables (env wins over these fields).
          </span>
        </div>
      </div>
    </div>
  );
}
