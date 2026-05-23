'use client';

import { useMemo } from 'react';
import { Activity, ArrowUpRight, Crown, Eye, MessageCircle, Search, ShieldAlert, Users } from 'lucide-react';

function number(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function money(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`;
}

function daysAgo(dateString) {
  const timestamp = new Date(dateString || 0).getTime();
  if (!timestamp) return 9999;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

function MiniMetric({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-950 p-3 text-white"><Icon size={17} /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-950">{value}</p>
          {hint && <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, max, hint }) {
  const width = max > 0 ? Math.min(100, Math.round((Number(value || 0) / max) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-black text-slate-950">{number(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-950" style={{ width: `${width}%` }} />
      </div>
      {hint && <p className="text-xs font-semibold text-slate-500">{hint}</p>}
    </div>
  );
}

export default function GrowthAnalyticsPanel({ dashboard }) {
  const listings = dashboard?.listings || [];
  const payments = dashboard?.payments || [];
  const reports = dashboard?.reports || [];
  const metrics = dashboard?.metrics || {};

  const analytics = useMemo(() => {
    const approved = listings.filter((x) => x.status === 'approved');
    const pending = listings.filter((x) => x.status === 'pending');
    const premium = listings.filter((x) => x.is_featured || x.is_premium);
    const last7 = listings.filter((x) => daysAgo(x.created_at) <= 7);
    const last30 = listings.filter((x) => daysAgo(x.created_at) <= 30);
    const views = listings.reduce((sum, x) => sum + Number(x.view_count || x.views || 0), 0);
    const paid = payments.filter((x) => x.status === 'paid');
    const revenue = paid.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const byCategory = listings.reduce((acc, item) => {
      const key = item.category || 'Diğer';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const categories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
    const topListings = [...listings]
      .sort((a, b) => Number(b.view_count || b.views || 0) - Number(a.view_count || a.views || 0))
      .slice(0, 8);
    const conversion = listings.length ? Math.round((premium.length / listings.length) * 100) : 0;
    const moderationRisk = pending.length + reports.filter((x) => !x.status || x.status === 'open').length;

    return { approved, pending, premium, last7, last30, views, paid, revenue, categories, topListings, conversion, moderationRisk };
  }, [listings, payments, reports]);

  const maxCategory = Math.max(1, ...analytics.categories.map((x) => x.value));

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide"><Activity size={14} /> Growth cockpit</div>
            <h3 className="mt-3 text-2xl font-black">Marketplace sağlığı</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Bu ekran ürünü yönetmek için. Boş kategori, düşük premium oranı ve bekleyen moderasyon büyümeyi direkt öldürür.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 text-sm font-bold text-slate-200">
            Öncelik skoru: <span className="text-white">{analytics.moderationRisk > 0 ? 'Moderasyon' : 'Büyüme'}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MiniMetric icon={Activity} label="Son 7 gün ilan" value={number(analytics.last7.length)} hint={`${number(analytics.last30.length)} / son 30 gün`} />
        <MiniMetric icon={Eye} label="Toplam görüntülenme" value={number(analytics.views || metrics.totalViews)} hint="İlan ilgisi" />
        <MiniMetric icon={Crown} label="Premium oranı" value={`%${analytics.conversion}`} hint={`${number(analytics.premium.length)} premium ilan`} />
        <MiniMetric icon={ArrowUpRight} label="Gelir" value={money(analytics.revenue || metrics.revenueXpf)} hint={`${number(analytics.paid.length)} paid order`} />
        <MiniMetric icon={Users} label="Kullanıcı" value={number(metrics.users)} hint="Profil tablosu" />
        <MiniMetric icon={MessageCircle} label="Onay bekleyen" value={number(analytics.pending.length)} hint="24 saat üstü beklememeli" />
        <MiniMetric icon={ShieldAlert} label="Açık şikayet" value={number(metrics.openReports)} hint="Güven riski" />
        <MiniMetric icon={Search} label="Kategori sayısı" value={number(analytics.categories.length)} hint="İçerik dağılımı" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="text-lg font-black">Kategori doluluğu</h3>
          <p className="mt-1 text-sm text-slate-500">Sahibinden mantığında kategori derinliği güven verir. Boş kategorileri seed veya gerçek ilanla doldur.</p>
          <div className="mt-5 space-y-4">
            {analytics.categories.length === 0 && <p className="text-sm text-slate-500">Henüz kategori verisi yok.</p>}
            {analytics.categories.map((item) => <ProgressRow key={item.label} label={item.label} value={item.value} max={maxCategory} />)}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="text-lg font-black">En çok görüntülenen ilanlar</h3>
          <p className="mt-1 text-sm text-slate-500">Bu liste hangi kategorinin çekim gücü olduğunu gösterir. Premium tekliflerini burada yoğunlaştır.</p>
          <div className="mt-5 space-y-3">
            {analytics.topListings.length === 0 && <p className="text-sm text-slate-500">Henüz görüntülenme verisi yok.</p>}
            {analytics.topListings.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">#{index + 1} {item.title}</p>
                  <p className="text-xs font-semibold text-slate-500">{item.category || 'Kategori yok'} · {item.location || 'Konum yok'}</p>
                </div>
                <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">{number(item.view_count || item.views)} görüntüleme</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="text-lg font-black">Büyüme aksiyonları</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="font-black">1. Boş kategorileri doldur</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Araç, emlak, elektronik ve tekne kategorilerinde en az 10'ar kaliteli ilan hedefle.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="font-black">2. Premium’u görünür yap</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Çok görüntülenen ilan sahiplerine öne çıkarma paketi öner. Gelir burada başlar.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="font-black">3. Moderasyonu hızlı tut</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Bekleyen ilanlar 24 saati geçerse satıcı tekrar ilan vermez. Bu KPI kritik.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
