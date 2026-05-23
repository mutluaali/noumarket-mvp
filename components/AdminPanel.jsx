'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, ShieldCheck, RefreshCw, Crown, AlertTriangle, CreditCard, Users, Eye, CheckCircle2, Ban, Trash2, Star, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SeedMarketplacePanel from '@/components/SeedMarketplacePanel';
import GrowthAnalyticsPanel from '@/components/GrowthAnalyticsPanel';
import ModerationQualityPanel from '@/components/ModerationQualityPanel';
import ProductAnalyticsPanel from '@/components/ProductAnalyticsPanel';

function money(amount, currency = 'XPF') {
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;
}

function statusBadge(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'rejected') return 'bg-red-50 text-red-700 ring-red-200';
  if (status === 'paid') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'open') return 'bg-red-50 text-red-700 ring-red-200';
  if (status === 'resolved') return 'bg-slate-100 text-slate-700 ring-slate-200';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-950 p-3 text-white"><Icon size={18} /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-950">{value}</p>
          {hint && <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export default function AdminPanel({ listings, onApprove, onReject, onDelete, onFeature, onClose }) {
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [busyReportId, setBusyReportId] = useState('');

  const approved = listings.filter((x) => x.status === 'approved');
  const pending = listings.filter((x) => x.status === 'pending');

  async function loadDashboard() {
    setLoading(true);
    setErrorText('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Admin verilerini almak için tekrar giriş yap.');
      const response = await fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Admin dashboard yüklenemedi.');
      setDashboard(payload);
    } catch (error) {
      setErrorText(error.message || 'Admin verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  const metrics = dashboard?.metrics || {};
  const reports = dashboard?.reports || [];
  const payments = dashboard?.payments || [];

  const tabs = [
    ['overview', 'Özet'],
    ['moderation', `Onay (${pending.length})`],
    ['reports', `Şikayetler (${metrics.openReports || 0})`],
    ['payments', 'Ödemeler'],
    ['analytics', 'Analytics'],
    ['product', 'Product analytics'],
    ['quality', 'Güvenlik kuyruğu'],
    ['seed', 'Seed içerik'],
  ];

  async function updateReport(reportId, status) {
    try {
      setBusyReportId(reportId);
      const token = await getToken();
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Şikayet güncellenemedi.');
      await loadDashboard();
    } catch (error) {
      alert(error.message || 'Şikayet güncellenemedi.');
    } finally {
      setBusyReportId('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-7xl overflow-auto rounded-3xl bg-slate-50 p-5 shadow-2xl">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white"><ShieldCheck size={14} /> Operasyon paneli</div>
            <h2 className="mt-2 text-2xl font-black">Admin paneli</h2>
            <p className="mt-1 text-sm text-slate-500">Moderasyon, şikayet, premium ve ödeme takibi tek ekranda.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadDashboard} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm"><span className="inline-flex items-center gap-2"><RefreshCw size={15} /> Yenile</span></button>
            <button onClick={onClose} className="rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"><X /></button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`rounded-2xl px-4 py-2 text-xs font-black ring-1 ${tab === key ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-700 ring-slate-200'}`}>{label}</button>
          ))}
        </div>

        {errorText && <div className="mb-5 rounded-3xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">{errorText}</div>}
        {loading && <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Admin metrikleri yükleniyor...</div>}

        {!loading && tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={BarChart3} label="Toplam ilan" value={metrics.totalListings ?? listings.length} hint={`${metrics.approvedListings ?? approved.length} yayında`} />
              <MetricCard icon={RefreshCw} label="Onay bekleyen" value={metrics.pendingListings ?? pending.length} hint="Hızlı moderasyon şart" />
              <MetricCard icon={Crown} label="Premium ilan" value={metrics.premiumListings ?? 0} hint="Gelir motoru" />
              <MetricCard icon={CreditCard} label="Gelir" value={money(metrics.revenueXpf || 0)} hint="Paid Stripe orders" />
              <MetricCard icon={AlertTriangle} label="Açık şikayet" value={metrics.openReports ?? 0} hint="Güven riski" />
              <MetricCard icon={Users} label="Kullanıcı" value={metrics.users ?? 0} />
              <MetricCard icon={Eye} label="Görüntülenme" value={metrics.totalViews ?? 0} />
              <MetricCard icon={CreditCard} label="Bekleyen ödeme" value={metrics.pendingPayments ?? 0} />
            </div>
            <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
              <h3 className="text-lg font-black">Operasyon önceliği</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Önce onay bekleyen ilanları temizle. Sonra açık şikayetleri kapat. Premium ödemelerde pending kalan kayıtlar varsa Stripe webhook/env ayarını kontrol et.</p>
            </div>
          </div>
        )}

        {!loading && tab === 'moderation' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <h3 className="mb-3 font-black">Onay bekleyen ilanlar</h3>
              {pending.length === 0 && <p className="text-sm text-slate-500">Onay bekleyen ilan yok.</p>}
              <div className="space-y-3">
                {pending.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="font-black">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.category} · {item.location} · {item.priceText}</div>
                    <div className="mt-3 flex gap-2"><button onClick={() => onApprove(item.id)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"><CheckCircle2 size={13} className="inline" /> Onayla</button><button onClick={() => onReject(item.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><Ban size={13} className="inline" /> Reddet</button></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <h3 className="mb-3 font-black">Yayındaki ilanlar</h3>
              <div className="space-y-3">
                {approved.slice(0, 80).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="font-black">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.category} · {item.location} · {item.priceText}</div>
                    <div className="mt-3 flex gap-2"><button onClick={() => onFeature(item.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><Star size={13} className="inline" /> {item.isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}</button><button onClick={() => onDelete(item.id)} className="rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={13} className="inline" /> Sil</button></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {!loading && tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 && <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Şikayet kaydı yok.</div>}
            {reports.map((report) => (
              <div key={report.id} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusBadge(report.status || 'open')}`}>{report.status || 'open'}</span>
                    <h3 className="mt-3 font-black">{report.reason || 'Şikayet'}</h3>
                    <p className="mt-1 text-sm text-slate-600">{report.details || 'Detay yok.'}</p>
                    <p className="mt-2 text-xs text-slate-500">İlan: {report.listing_id} · {new Date(report.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busyReportId === report.id} onClick={() => updateReport(report.id, 'reviewing')} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">İncelemede</button>
                    <button disabled={busyReportId === report.id} onClick={() => updateReport(report.id, 'resolved')} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">Çözüldü</button>
                    <button disabled={busyReportId === report.id} onClick={() => updateReport(report.id, 'dismissed')} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">Kapat</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'analytics' && (
          <GrowthAnalyticsPanel dashboard={dashboard} />
        )}

        {!loading && tab === 'product' && (
          <ProductAnalyticsPanel dashboard={dashboard} />
        )}

        {!loading && tab === 'quality' && (
          <ModerationQualityPanel />
        )}

        {!loading && tab === 'seed' && (
          <SeedMarketplacePanel onSeeded={() => { loadDashboard(); }} />
        )}

        {!loading && tab === 'payments' && (
          <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
            <div className="grid grid-cols-5 gap-3 border-b border-slate-200 bg-slate-50 p-3 text-xs font-black uppercase text-slate-500">
              <div>Plan</div><div>Tutar</div><div>Durum</div><div>Tarih</div><div>Session</div>
            </div>
            {payments.length === 0 && <div className="p-5 text-sm text-slate-500">Ödeme kaydı yok.</div>}
            {payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-5 gap-3 border-b border-slate-100 p-3 text-sm last:border-0">
                <div className="font-bold">{payment.plan || 'premium'}</div>
                <div>{money(payment.amount, payment.currency)}</div>
                <div><span className={`rounded-full px-2 py-1 text-xs font-black ring-1 ${statusBadge(payment.status)}`}>{payment.status}</span></div>
                <div className="text-slate-500">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('tr-TR') : '-'}</div>
                <div className="truncate text-xs text-slate-400">{payment.provider_session_id || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
