'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, RefreshCw, X } from 'lucide-react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications';

function formatDate(value) {
  if (!value) return '';

  try {
    return new Date(value).toLocaleString('tr-TR');
  } catch {
    return '';
  }
}

export default function NotificationsModal({ onClose, onChanged }) {
  const mountedRef = useRef(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState('');

  async function loadNotifications() {
    setLoading(true);
    setErrorText('');

    try {
      const rows = await getNotifications();

      if (!mountedRef.current) return;

      setItems(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('NotificationsModal load error:', error);

      if (!mountedRef.current) return;

      setItems([]);
      setErrorText(error?.message || 'Bildirimler yüklenemedi.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadNotifications();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleMarkAllRead() {
    setBusy(true);

    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      onChanged?.();
    } catch (error) {
      alert(error.message || 'Bildirimler güncellenemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
      onChanged?.();
    } catch (error) {
      alert(error.message || 'Bildirim güncellenemedi.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-4xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
              <Bell size={16} /> Bildirimler
            </div>
            <h2 className="text-2xl font-black">Hesap bildirimlerin</h2>
            <p className="mt-1 text-sm text-slate-500">
              İlan onayları, mesajlar ve önemli platform hareketleri burada görünür.
            </p>
          </div>

          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={15} /> Yenile
            </span>
          </button>

          <button
            onClick={handleMarkAllRead}
            disabled={busy || loading}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCheck size={15} /> Tümünü okundu yap
            </span>
          </button>
        </div>

        {loading && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Bildirimler yükleniyor...
          </div>
        )}

        {!loading && errorText && (
          <div className="rounded-3xl bg-red-50 p-6 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {errorText}
          </div>
        )}

        {!loading && !errorText && items.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz bildirimin yok.
          </div>
        )}

        {!loading && !errorText && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-3xl p-4 ring-1 ${
                  item.is_read
                    ? 'bg-white ring-slate-200'
                    : 'bg-blue-50 ring-blue-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">
                      {item.title || 'Bildirim'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.body || item.message || item.description || 'Bildirim detayı yok.'}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {formatDate(item.created_at)}
                    </p>
                  </div>

                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="shrink-0 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
                    >
                      Okundu
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
