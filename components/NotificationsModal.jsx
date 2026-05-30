'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { ModalShell, EmptyState, ErrorState, LoginRequired } from '@/components/AsyncState';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/notifications';
import { formatNotificationTime, normalizeNotification } from '@/lib/notificationDisplay';
import { getErrorMessage } from '@/lib/safeAsync';

export default function NotificationsModal({ user, onClose, onUnreadChange, onAction }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items]
  );

  async function loadNotifications() {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Bildirimler yüklenirken bir sorun oluştu.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    if (!user?.id || markingAll) return;
    setMarkingAll(true);
    setActionError('');
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      onUnreadChange?.();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Bildirim güncellenemedi.'));
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(id) {
    if (!id || markingId === id) return;
    setMarkingId(id);
    setActionError('');
    try {
      await markNotificationRead(id);
      setItems((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
      onUnreadChange?.();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Bildirim güncellenemedi.'));
    } finally {
      setMarkingId(null);
    }
  }

  async function handleNotificationClick(item) {
    const normalized = normalizeNotification(item);
    if (!item.is_read) await markOneRead(item.id);
    if (normalized.actionTarget && onAction) {
      onAction(normalized);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  return (
    <ModalShell
      eyebrow="Bildirimler"
      title="Bildirimlerin"
      subtitle={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'İlan, mesaj ve hesap hareketleri burada görünür.'}
      onClose={onClose}
      action={user?.id ? (
        <button
          type="button"
          onClick={loadNotifications}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-slate-200 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      ) : null}
    >
      {!user?.id ? (
        <LoginRequired title="Bildirimleri görmek için giriş yap" text="Hesap hareketleri giriş yaptıktan sonra burada görünür." />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-cyan-700"
            >
              <CheckCheck size={16} />
              {markingAll ? 'İşleniyor...' : 'Tümünü okundu işaretle'}
            </button>
            {unreadCount > 0 ? (
              <span className="inline-flex w-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800 ring-1 ring-cyan-100">
                Okunmamış: {unreadCount}
              </span>
            ) : null}
          </div>

          {actionError ? (
            <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800 ring-1 ring-rose-100">
              {actionError}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Bildirimler yükleniyor...
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={loadNotifications} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Henüz bildiriminiz yok"
              text="Önemli gelişmeler burada görünecek."
            />
          ) : (
            <div className="grid gap-3">
              {items.map((item) => {
                const normalized = normalizeNotification(item);
                const isUnread = !item.is_read;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition sm:rounded-3xl ${
                      isUnread
                        ? 'border-cyan-200 bg-cyan-50/70 dark:border-cyan-400/20 dark:bg-cyan-400/10'
                        : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-black text-slate-950 dark:text-white">{normalized.displayTitle}</div>
                          {isUnread ? (
                            <span className="rounded-full bg-cyan-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                              Okunmamış
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-400">
                              Okundu
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{normalized.displayMessage}</p>
                        <div className="mt-2 text-xs font-bold text-slate-400">{formatNotificationTime(item.created_at)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {normalized.actionLabel && normalized.actionTarget ? (
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white dark:bg-cyan-700"
                        >
                          {normalized.actionLabel}
                          <ChevronRight size={14} />
                        </button>
                      ) : null}
                      {isUnread ? (
                        <button
                          type="button"
                          disabled={markingId === item.id}
                          onClick={() => markOneRead(item.id)}
                          className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60 dark:border-white/10 dark:text-slate-200"
                        >
                          {markingId === item.id ? 'Kaydediliyor...' : 'Okundu olarak işaretle'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}
