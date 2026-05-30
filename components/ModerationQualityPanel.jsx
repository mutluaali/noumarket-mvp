'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Ban, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

function badge(level) {
  if (level === 'high') return 'bg-red-50 text-red-700 ring-red-200';
  if (level === 'medium') return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
}

export default function ModerationQualityPanel() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    setErrorText('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Yönetim paneli için tekrar giriş yap.');
      const response = await fetch('/api/admin/moderation-quality', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Moderasyon verileri alınamadı.');
      setItems(payload.items || []);
      setStats(payload.stats || null);
    } catch (error) {
      setErrorText(error.message || 'Moderasyon verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function action(id, actionType) {
    setBusyId(id);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/moderation-quality', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: id, action: actionType }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'İşlem yapılamadı.');
      await load();
    } catch (error) {
      alert(error.message || 'İşlem yapılamadı.');
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Moderasyon kalite verileri yükleniyor...</div>;
  if (errorText) return <div className="rounded-3xl bg-red-50 p-5 text-sm font-semibold text-red-700 ring-1 ring-red-100">{errorText}</div>;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-500">Risk kuyruğu</div><div className="mt-1 text-3xl font-black">{stats?.totalQueue || 0}</div></div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-500">Yüksek risk</div><div className="mt-1 text-3xl font-black text-red-600">{stats?.highRisk || 0}</div></div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-500">Orta risk</div><div className="mt-1 text-3xl font-black text-amber-600">{stats?.mediumRisk || 0}</div></div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-500">Bugün aksiyon</div><div className="mt-1 text-3xl font-black">{stats?.todayActions || 0}</div></div>
      </div>

      <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white"><ShieldAlert size={14} /> Güvenlik kuyruğu</div>
            <h3 className="mt-2 text-lg font-black">Şüpheli ilan kontrolü</h3>
            <p className="mt-1 text-sm text-slate-500">Acil satış, ön ödeme, eksik iletişim ve riskli ifade sinyallerine göre sıralanır.</p>
          </div>
          <button onClick={load} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold"><RefreshCw size={15} className="inline" /> Yenile</button>
        </div>
      </div>

      {items.length === 0 && <div className="rounded-3xl bg-emerald-50 p-5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">Şu an risk kuyruğu temiz.</div>}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${badge(item.risk_level)}`}>{item.risk_level || 'low'} · {item.risk_score || 0}/100</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.status}</span>
                </div>
                <h4 className="mt-3 truncate text-lg font-black">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-500">{item.category} · {item.location} · {Number(item.price || 0).toLocaleString('fr-FR')} XPF</p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.description || 'Açıklama yok.'}</p>
                {Array.isArray(item.risk_reasons) && item.risk_reasons.length > 0 && (
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                    <AlertTriangle size={14} className="mr-1 inline" /> {item.risk_reasons.join(' · ')}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button disabled={busyId === item.id} onClick={() => action(item.id, 'approve')} className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white"><CheckCircle2 size={14} className="inline" /> Onayla</button>
                <button disabled={busyId === item.id} onClick={() => action(item.id, 'review')} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black"><ShieldCheck size={14} className="inline" /> İncelemede</button>
                <button disabled={busyId === item.id} onClick={() => action(item.id, 'block')} className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-black text-red-700"><Ban size={14} className="inline" /> Engelle</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
