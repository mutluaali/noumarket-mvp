'use client';

import { useEffect, useState } from 'react';
import { Database, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export default function SeedMarketplacePanel({ onSeeded }) {
  const [seedCount, setSeedCount] = useState(0);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadStatus() {
    setLoading(true);
    setMessage('');
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/seed', { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Seed durumu alınamadı.');
      setSeedCount(payload.seedCount || 0);
      setAvailable(payload.available || 0);
    } catch (error) {
      setMessage(error.message || 'Seed durumu alınamadı.');
    } finally {
      setLoading(false);
    }
  }

  async function runSeed(mode) {
    const confirmText = mode === 'reset'
      ? 'Mevcut seed ilanları silip yeniden oluşturmak istiyor musun? Gerçek kullanıcı ilanlarına dokunulmaz.'
      : 'Eksik demo ilanları oluşturulsun mu?';

    if (!window.confirm(confirmText)) return;

    setBusy(true);
    setMessage('');
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Seed işlemi başarısız.');
      setMessage(`${payload.inserted || 0} demo ilan oluşturuldu.`);
      await loadStatus();
      onSeeded?.();
    } catch (error) {
      setMessage(error.message || 'Seed işlemi başarısız.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { loadStatus(); }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
          <Database size={14} /> Marketplace doluluk motoru
        </div>
        <h3 className="mt-3 text-xl font-black">Seed ilan sistemi</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Boş marketplace güven vermez. Bu araç Nouméa/Yeni Kaledonya için gerçekçi vitrin ilanları oluşturur: araç, emlak, elektronik, denizcilik, hizmet ve ev yaşamı.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">Mevcut seed ilan</p>
            <p className="mt-1 text-3xl font-black">{loading ? '...' : seedCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-black uppercase text-slate-500">Hazır seed havuzu</p>
            <p className="mt-1 text-3xl font-black">{loading ? '...' : available}</p>
          </div>
        </div>

        {message && <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">{message}</div>}

        <div className="mt-5 flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => runSeed('insert_missing')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
            <span className="inline-flex items-center gap-2"><Sparkles size={16} /> Eksik ilanları oluştur</span>
          </button>
          <button disabled={busy} onClick={() => runSeed('reset')} className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-red-600 disabled:opacity-60">
            <span className="inline-flex items-center gap-2"><Trash2 size={16} /> Seed ilanları yenile</span>
          </button>
          <button disabled={busy} onClick={loadStatus} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-60">
            <span className="inline-flex items-center gap-2"><RefreshCw size={16} /> Durumu yenile</span>
          </button>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="text-lg font-black">Seed stratejisi</h3>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <p><strong className="text-slate-950">Amaç:</strong> İlk kullanıcı siteye girdiğinde platformun canlı olduğunu hissetmeli.</p>
          <p><strong className="text-slate-950">Kural:</strong> Seed ilanlar gerçek kullanıcı ilanı gibi davranır ama metadata içinde <code>seed=true</code> taşır. İstersen tek tuşla yenilenir.</p>
          <p><strong className="text-slate-950">Risk:</strong> Gerçek lansmanda seed/fake ilanları net yönetmezsen güven problemi doğar. İlk testte iyi, gerçek pazarlamada kontrollü kullanılmalı.</p>
          <p><strong className="text-slate-950">Sonraki adım:</strong> AI destekli ilan kalite skoru, scam/duplicate detection ve gerçek analytics eklenmeli.</p>
        </div>
      </section>
    </div>
  );
}
