'use client';

import { Activity, Heart, MessageCircle, PlusCircle, Search, TrendingUp, Users, Eye } from 'lucide-react';

function pct(value) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function Card({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-950 p-3 text-white"><Icon size={18} /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          {hint && <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ProductAnalyticsPanel({ dashboard }) {
  const analytics = dashboard?.analytics || {};
  const events = analytics.events || {};
  const topSearches = analytics.topSearches || [];
  const lastEvents = analytics.lastEvents || [];

  const visitors = analytics.uniqueSessions || 0;
  const listingCreates = events.listing_create || 0;
  const searches = events.search || 0;
  const favorites = events.favorite_add || 0;
  const messages = events.message_start || 0;
  const detailViews = events.listing_detail_view || 0;
  const authStarts = events.auth_open || 0;

  const createRate = visitors ? (listingCreates / visitors) * 100 : 0;
  const messageRate = detailViews ? (messages / detailViews) * 100 : 0;
  const favoriteRate = detailViews ? (favorites / detailViews) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card icon={Users} label="Oturum" value={visitors} hint="Son 30 gün benzersiz session" />
        <Card icon={Search} label="Arama" value={searches} hint="Kullanıcı niyeti" />
        <Card icon={Eye} label="Detay görüntüleme" value={detailViews} hint="İlan ilgisi" />
        <Card icon={PlusCircle} label="İlan oluşturma" value={listingCreates} hint={`Ziyaretçi → ilan: ${pct(createRate)}`} />
        <Card icon={Heart} label="Favori" value={favorites} hint={`Detay → favori: ${pct(favoriteRate)}`} />
        <Card icon={MessageCircle} label="Mesaj başlatma" value={messages} hint={`Detay → mesaj: ${pct(messageRate)}`} />
        <Card icon={Activity} label="Auth açılışı" value={authStarts} hint="Giriş/kayıt niyeti" />
        <Card icon={TrendingUp} label="Toplam event" value={analytics.totalEvents || 0} hint="Ölçülen ürün aktivitesi" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="text-lg font-black">Funnel yorumu</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><b>Arama → detay:</b> Arama yüksek ama detay düşükse kart tasarımı, fotoğraf kalitesi veya fiyatlar zayıftır.</div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><b>Detay → mesaj:</b> Mesaj oranı düşükse satıcı güveni, telefon görünürlüğü veya CTA zayıftır.</div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"><b>Ziyaretçi → ilan:</b> İlan oluşturma düşükse onboarding ve form hâlâ ağırdır.</div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="text-lg font-black">En çok arananlar</h3>
          <div className="mt-4 space-y-2">
            {topSearches.length === 0 && <p className="text-sm text-slate-500">Henüz arama verisi yok.</p>}
            {topSearches.map((item, index) => (
              <div key={`${item.query}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                <span className="text-sm font-bold text-slate-800">{item.query || 'Boş arama'}</span>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="text-lg font-black">Son eventler</h3>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-4 bg-slate-50 p-3 text-xs font-black uppercase text-slate-500">
            <div>Event</div><div>Path</div><div>User</div><div>Zaman</div>
          </div>
          {lastEvents.length === 0 && <div className="p-4 text-sm text-slate-500">Henüz event yok.</div>}
          {lastEvents.map((event) => (
            <div key={event.id} className="grid grid-cols-4 gap-3 border-t border-slate-100 p-3 text-xs text-slate-600">
              <div className="font-black text-slate-900">{event.event_name}</div>
              <div className="truncate">{event.path || '-'}</div>
              <div className="truncate">{event.user_id || 'anon'}</div>
              <div>{event.created_at ? new Date(event.created_at).toLocaleString('tr-TR') : '-'}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
