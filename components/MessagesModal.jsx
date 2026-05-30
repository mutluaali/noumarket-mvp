'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { ModalShell, SkeletonBox, EmptyState, ErrorState, LoginRequired } from '@/components/AsyncState';
import { getErrorMessage } from '@/lib/safeAsync';
import { getMyConversations } from '@/lib/messages';

function formatConversationTime(value) {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return '-';
  }
}

function conversationRoleLabel(item, userId) {
  if (!userId) return '';
  if (item.buyer_id === userId) return 'Satıcı ile';
  if (item.seller_id === userId) return 'Alıcı ile';
  return 'Konuşma';
}

export default function MessagesModal({ user, onClose, onOpenConversation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const data = await getMyConversations(user.id);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Mesajlar yüklenemedi.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const unreadTotal = items.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);

  return (
    <ModalShell
      eyebrow="Gelen kutusu"
      title="Konuşmalar"
      subtitle={unreadTotal > 0 ? `${unreadTotal} okunmamış mesajın var.` : 'Alıcı ve satıcı mesajları burada görünür.'}
      onClose={onClose}
      action={user?.id ? (
        <button type="button" onClick={load} className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-slate-200">
          <RefreshCw size={16} /> Yenile
        </button>
      ) : null}
    >
      {!user?.id ? (
        <LoginRequired title="Mesajları görmek için giriş yap" text="Mesajlaşma hesabına bağlı çalışır." />
      ) : loading ? (
        <SkeletonBox lines={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Henüz konuşmanız yok"
          text="Bir ilanın satıcısına mesaj attığında konuşma burada görünür."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenConversation?.(item)}
              className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
                <MessageCircle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate font-black text-slate-900">{item.listings?.title || item.title || 'Konuşma'}</div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    {conversationRoleLabel(item, user.id)}
                  </span>
                </div>
                <div className="mt-1 truncate text-sm text-slate-500">
                  <span className="font-bold text-slate-600">Son mesaj:</span>{' '}
                  {item.last_message?.body || 'Henüz mesaj yok'}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-400">
                  {formatConversationTime(item.last_message?.created_at || item.updated_at)}
                </div>
              </div>
              {item.unread_count ? (
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-cyan-700 px-2.5 py-1 text-xs font-black text-white">{item.unread_count}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-700">Okunmamış</span>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
