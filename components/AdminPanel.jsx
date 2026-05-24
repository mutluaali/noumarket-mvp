'use client';

import { useMemo, useState } from 'react';
import { X, CheckCircle2, XCircle, Trash2, Crown, Eye, Search, ShieldAlert, BarChart3, Clock, UserRound, Filter, AlertTriangle } from 'lucide-react';

const statusLabels = {
  all: 'Tümü',
  pending: 'Onay bekliyor',
  approved: 'Yayında',
  rejected: 'Reddedildi',
};

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

function AdminStat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl bg-slate-100 p-3"><Icon size={18} /></div>
        <div className="text-right">
          <div className="text-2xl font-black">{value}</div>
          <div className="text-xs font-bold text-slate-500">{label}</div>
        </div>
      </div>
      {hint && <p className="mt-3 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

export default function AdminPanel({ listings = [], onApprove, onReject, onDelete, onFeature, onClose }) {
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const stats = useMemo(() => {
    const total = listings.length;
    const pending = listings.filter((item) => item.status === 'pending').length;
    const approved = listings.filter((item) => item.status === 'approved').length;
    const rejected = listings.filter((item) => item.status === 'rejected').length;
    const premium = listings.filter((item) => item.isFeatured).length;
    const risky = listings.filter((item) => Number(item.trustScore || 0) < 55).length;
    const views = listings.reduce((sum, item) => sum + Number(item.views || 0), 0);
    return { total, pending, approved, rejected, premium, risky, views };
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings
      .filter((item) => status === 'all' || item.status === status)
      .filter((item) => !q || [item.title, item.category, item.categoryLabel, item.location, item.seller, item.email, item.phone].filter(Boolean).join(' ').toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [listings, status, query]);

  async function rejectSelected() {
    if (!selected) return;
    await onReject(selected.id, rejectNote);
    setSelected(null);
    setRejectNote('');
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl font-black">Admin operasyon merkezi</h2>
            <p className="text-sm text-slate-500">İlan onayı, risk takibi, premium yönetimi ve moderasyon</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200"><X size={20} /></button>
        </div>

        <div className="p-5 md:p-7">
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            <AdminStat icon={BarChart3} label="Toplam" value={stats.total} />
            <AdminStat icon={Clock} label="Bekleyen" value={stats.pending} hint="Dashboard’da görünmemesi ciddi operasyon hatasıydı." />
            <AdminStat icon={CheckCircle2} label="Yayında" value={stats.approved} />
            <AdminStat icon={XCircle} label="Reddedildi" value={stats.rejected} />
            <AdminStat icon={Crown} label="Premium" value={stats.premium} />
            <AdminStat icon={ShieldAlert} label="Riskli" value={stats.risky} />
            <AdminStat icon={Eye} label="Görüntülenme" value={stats.views} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="mb-3 flex items-center gap-2 text-sm font-black"><Filter size={17} /> Filtreler</div>
                <div className="grid gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button key={key} onClick={() => setStatus(key)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${status === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık, satıcı, kategori ara" className="w-full bg-transparent text-sm outline-none" />
                </div>
              </div>

              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-black"><AlertTriangle size={18} /> Operasyon notu</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">Onay bekleyen ilan detayına girilemiyorsa admin panel işlevsizdir. Bu sürümde her ilan tek tıkla detay/önizleme açar.</p>
              </div>
            </aside>

            <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 p-4">
                <div className="text-sm font-black">{filtered.length} ilan listeleniyor</div>
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <div key={item.id} className="grid gap-4 p-4 md:grid-cols-[92px_1fr_auto] md:items-center">
                    <button onClick={() => setSelected(item)} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(item.status)}`}>{statusLabels[item.status] || item.status}</span>
                        {item.isFeatured && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">Premium</span>}
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Güven: {item.trustScore || 0}/100</span>
                      </div>
                      <button onClick={() => setSelected(item)} className="mt-2 block text-left text-lg font-black hover:underline">{item.title}</button>
                      <div className="mt-1 text-sm text-slate-500">{item.categoryLabel || item.category} • {item.location} • {item.priceText}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatDate(item.created_at)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button onClick={() => setSelected(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">Detay</button>
                      {item.status !== 'approved' && <button onClick={() => onApprove(item.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Onayla</button>}
                      {item.status !== 'rejected' && <button onClick={() => { setSelected(item); setRejectNote(''); }} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white">Reddet</button>}
                      <button onClick={() => onFeature(item.id)} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white">Premium</button>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="p-10 text-center text-sm font-bold text-slate-400">Bu filtrede ilan yok.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-xl font-black">İlan detay / moderasyon</h3>
                <p className="text-sm text-slate-500">Admin burada ilanın tamamını görür ve karar verir.</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full bg-slate-100 p-2"><X size={20} /></button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
              <div className="p-5">
                <div className="overflow-hidden rounded-3xl bg-slate-100">
                  <img src={selected.image} alt={selected.title} className="max-h-[420px] w-full object-cover" />
                </div>
                <div className="mt-5">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(selected.status)}`}>{statusLabels[selected.status] || selected.status}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{selected.categoryLabel || selected.category}</span>
                  </div>
                  <h4 className="mt-3 text-2xl font-black">{selected.title}</h4>
                  <div className="mt-2 text-2xl font-black text-slate-900">{selected.priceText}</div>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{selected.description || 'Açıklama yok.'}</p>
                </div>

                {selected.attributes && Object.keys(selected.attributes).length > 0 && (
                  <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="mb-3 text-sm font-black">Kategori alanları</div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.entries(selected.attributes).filter(([, value]) => Boolean(value)).map(([key, value]) => (
                        <div key={key} className="rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-100">
                          <div className="text-xs font-bold text-slate-400">{key}</div>
                          <div className="font-bold text-slate-700">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center gap-2 text-sm font-black"><UserRound size={18} /> Satıcı</div>
                    <div className="mt-3 text-sm text-slate-600">
                      <div><strong>Ad:</strong> {selected.seller || '-'}</div>
                      <div><strong>Telefon:</strong> {selected.phone || '-'}</div>
                      <div><strong>Email:</strong> {selected.email || '-'}</div>
                      <div><strong>Konum:</strong> {selected.location || '-'}</div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black">Güven / Risk skoru</div>
                      <div className="text-xl font-black">{selected.trustScore || 0}</div>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${selected.trustScore || 0}%` }} />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">55 altı skorlar manuel kontrol gerektirir.</p>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">Red notu</span>
                    <textarea value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows={3} placeholder="Eksik fotoğraf, şüpheli fiyat, yasaklı içerik..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                  </label>

                  <div className="grid gap-2">
                    <button onClick={async () => { await onApprove(selected.id); setSelected(null); }} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"><CheckCircle2 className="mr-2 inline" size={17} /> Onayla</button>
                    <button onClick={rejectSelected} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white"><XCircle className="mr-2 inline" size={17} /> Reddet</button>
                    <button onClick={async () => { await onFeature(selected.id); setSelected(null); }} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white"><Crown className="mr-2 inline" size={17} /> Premium değiştir</button>
                    <button onClick={async () => { if (confirm('Bu ilan silinsin mi?')) { await onDelete(selected.id); setSelected(null); } }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><Trash2 className="mr-2 inline" size={17} /> Sil</button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
