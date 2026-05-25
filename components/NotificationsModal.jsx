'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, RefreshCw, X } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/notifications';
import { getErrorMessage } from '@/lib/safeAsync';

export default function NotificationsModal({ user, onClose, onReadAll }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadNotifications() {
    if (!user?.id) {
      setItems([]);
      setError('Bildirimleri görmek için giriş yapmalısın.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Bildirimler yüklenemedi.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    if (!user?.id) return;
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      onReadAll?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Bildirimler okundu yapılamadı.'));
    }
  }

  async function markOneRead(id) {
    if (!id) return;
    try {
      await markNotificationRead(id);
      setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
      onReadAll?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Bildirim okundu yapılamadı.'));
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="mx-auto mt-10 max-h-[86vh] max-w-3xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-blue-700">
              <Bell size={17} /> Bildirimler
            </div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Bildirimlerin</h2>
            <p className="mt-1 text-sm text-slate-500">İlan, mesaj ve hesap hareketleri burada görünür.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadNotifications}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} /> Yenile
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 p-3 text-slate-900 hover:bg-slate-200"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={!items.some((item) => !item.is_read)}
          className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck size={16} /> Tümünü okundu işaretle
        </button>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
            Bildirimler yükleniyor...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
              <Bell />
            </div>
            <div className="text-lg font-black text-slate-950">Henüz bildirimin yok</div>
            <p className="mt-1 text-sm text-slate-500">Yeni mesajlar, favoriler ve ilan hareketleri burada listelenecek.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => !item.is_read && markOneRead(item.id)}
                className={
                  'w-full rounded-3xl border p-4 text-left transition hover:bg-slate-50 ' +
                  (item.is_read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50')
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-black text-slate-950">{item.title || 'Bildirim'}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">{item.message || item.body || 'Yeni hareket var.'}</div>
                    <div className="mt-2 text-xs font-bold text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : ''}</div>
                  </div>
                  {!item.is_read && <span className="mt-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white">Yeni</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
