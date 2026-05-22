'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Bell, CheckCheck, Trash2 } from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/lib/notifications';

function labelForType(type) {
  switch (type) {
    case 'listing_approved':
      return 'İlan onayı';
    case 'listing_rejected':
      return 'İlan reddi';
    case 'new_message':
      return 'Mesaj';
    case 'favorite':
      return 'Favori';
    default:
      return 'Bildirim';
  }
}


  async function getCurrentUser() {
    if (user?.id) return user;

    try {
      const { data } = await supabase.auth.getSession();

      if (data?.session?.user) {
        return data.session.user;
      }

      const userResult = await supabase.auth.getUser();
      return userResult?.data?.user || null;
    } catch (error) {
      console.error('auth resolve error:', error);
      return null;
    }
  }

export default function NotificationsModal({ user, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  async function loadNotifications() {
    const currentUser = await getCurrentUser();

      if (!currentUser?.id) {
        setLoading(false);
        setErrorText('Oturum bulunamadı. Lütfen tekrar giriş yap.');
        return;
      }

      setLoading(true);

    try {
      const rows = await getNotifications(currentUser.id);
      setItems(rows);
    } catch (error) {
      alert(error.message || 'Bildirimler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch (error) {
      alert(error.message || 'Bildirim güncellenemedi.');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead(currentUser.id);
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      alert(error.message || 'Bildirimler güncellenemedi.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteNotification(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      alert(error.message || 'Bildirim silinemedi.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-3xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Bell size={16} /> Bildirimler
            </div>
            <h2 className="mt-1 text-2xl font-black">Hesap bildirimlerin</h2>
            <p className="mt-1 text-sm text-slate-500">
              İlan onayları, mesajlar ve önemli platform hareketleri burada görünür.
            </p>
          </div>

          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="mb-4 flex justify-end">
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm"
          >
            <CheckCheck size={16} /> Tümünü okundu yap
          </button>
        </div>

        {errorText && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200 mb-4">{errorText}</p>}

        {loading && <p className="text-sm text-slate-500">Bildirimler yükleniyor...</p>}

        {!loading && items.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz bildirim yok.
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl p-4 ring-1 ${
                item.is_read
                  ? 'bg-white ring-slate-200'
                  : 'bg-sky-50 ring-sky-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {labelForType(item.type)}
                  </div>
                  <div className="mt-1 text-lg font-black">{item.title}</div>
                  {item.body && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  )}
                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
                    >
                      Okundu
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
