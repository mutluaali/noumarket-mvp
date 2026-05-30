'use client';

import { Flag, Heart, MapPin, MessageCircle, PlusCircle, Tags, UserPlus, Users } from 'lucide-react';

function InsightStat({ icon: Icon, label, value, hint, unavailable }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl bg-slate-100 p-3"><Icon size={18} /></div>
        <div className="text-right">
          <div className="text-2xl font-black">{unavailable ? '—' : value}</div>
          <div className="text-xs font-bold text-slate-500">{label}</div>
        </div>
      </div>
      {hint ? <p className="mt-3 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function RankList({ title, icon: Icon, items, emptyLabel, unavailable }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-slate-700" />
        <h3 className="text-sm font-black">{title}</h3>
      </div>
      <div className="mt-4 space-y-2">
        {unavailable ? (
          <p className="text-sm text-slate-500">Bu liste şu an yüklenemedi.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
              <span className="truncate text-sm font-bold text-slate-800">{item.label}</span>
              <span className="ml-3 shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const failureLabels = {
  counts: 'sayım metrikleri',
  dau: 'aktif kullanıcı',
  rankings: 'kategori/konum sıralaması',
  all: 'tüm ürün metrikleri',
};

export default function ProductInsightsPanel({ insights, loading }) {
  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Ürün metrikleri yükleniyor…</p>
      </section>
    );
  }

  if (!insights) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        Ürün metrikleri yüklenemedi. Yenile butonunu kullanın.
      </section>
    );
  }

  const { registrations, listings, messages, reports, favorites, topCategories, topLocations, partialFailures = [] } = insights;
  const countsFailed = partialFailures.includes('counts') || partialFailures.includes('all');
  const dauFailed = partialFailures.includes('dau') || partialFailures.includes('all');
  const rankingsFailed = partialFailures.includes('rankings') || partialFailures.includes('all');
  const partialLabels = partialFailures.map((key) => failureLabels[key] || key).filter(Boolean);

  return (
    <section className="space-y-5">
      <div>
        <div className="text-sm font-black">Ürün kullanımı</div>
        <p className="mt-1 text-xs text-slate-500">
          Gerçek veritabanı kayıtlarından hesaplanır. Bugünkü aktif kullanıcı: kayıt, ilan, mesaj, favori veya şikayet aktivitesi olan benzersiz kullanıcılar.
        </p>
      </div>

      {partialLabels.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
          Bazı metrikler yüklenemedi ({partialLabels.join(', ')}). Mevcut veriler gösteriliyor; Yenile’yi deneyin.
        </div>
      ) : null}

      {insights.rankingsTruncated ? (
        <p className="text-xs text-slate-500">Kategori/konum sıralaması en fazla 5000 yayındaki ilan üzerinden hesaplandı.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightStat icon={Users} label="Bugünkü aktif kullanıcı" value={insights.dailyActiveUsers ?? 0} unavailable={dauFailed} hint="Benzersiz kullanıcı (bugün)" />
        <InsightStat icon={UserPlus} label="Kayıtlar" value={registrations?.total ?? 0} unavailable={countsFailed} hint={countsFailed ? 'Sayım yüklenemedi' : `Bugün +${registrations?.today ?? 0} · 7g +${registrations?.last7Days ?? 0}`} />
        <InsightStat icon={PlusCircle} label="Oluşturulan ilanlar" value={listings?.createdTotal ?? 0} unavailable={countsFailed} hint={countsFailed ? 'Sayım yüklenemedi' : `Onaylı ${listings?.approved ?? 0} · Red ${listings?.rejected ?? 0}`} />
        <InsightStat icon={MessageCircle} label="Gönderilen mesajlar" value={messages?.total ?? 0} unavailable={countsFailed} hint={countsFailed ? 'Sayım yüklenemedi' : `Bugün ${messages?.today ?? 0} · 7g ${messages?.last7Days ?? 0}`} />
        <InsightStat icon={Flag} label="Şikayetler" value={reports?.total ?? 0} unavailable={countsFailed} hint={countsFailed ? 'Sayım yüklenemedi' : `Bugün ${reports?.today ?? 0}`} />
        <InsightStat icon={Heart} label="Favoriler" value={favorites?.total ?? 0} unavailable={countsFailed} hint={countsFailed ? 'Sayım yüklenemedi' : `Bugün ${favorites?.today ?? 0} · 7g ${favorites?.last7Days ?? 0}`} />
        <InsightStat icon={PlusCircle} label="Bugün yeni ilan" value={listings?.createdToday ?? 0} unavailable={countsFailed} hint={countsFailed ? 'Sayım yüklenemedi' : `30g +${listings?.createdLast30Days ?? 0}`} />
        <InsightStat icon={UserPlus} label="Bugün yeni kayıt" value={registrations?.today ?? 0} unavailable={countsFailed} hint={countsFailed ? 'Sayım yüklenemedi' : `30g +${registrations?.last30Days ?? 0}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RankList title="En çok ilan — kategori (yayındaki)" icon={Tags} items={topCategories || []} emptyLabel="Yayındaki ilan yok." unavailable={rankingsFailed} />
        <RankList title="En çok ilan — konum (yayındaki)" icon={MapPin} items={topLocations || []} emptyLabel="Konum verisi yok." unavailable={rankingsFailed} />
      </div>
    </section>
  );
}
