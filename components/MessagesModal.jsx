'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { ModalShell, SkeletonBox, EmptyState, ErrorState, LoginRequired } from '@/components/AsyncState';
import { getErrorMessage } from '@/lib/safeAsync';
import { getMyConversations } from '@/lib/messages';

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
      console.error('MessagesModal:', err);
      setError(getErrorMessage(err, 'Mesajlar yüklenemedi.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <ModalShell eyebrow="Mesajlar" title="Konuşmaların" subtitle="Alıcı ve satıcı mesajları burada görünür." onClose={onClose} action={user?.id ? <button onClick={load} className="hidden items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-slate-200 md:inline-flex"><RefreshCw size={16}/> Yenile</button> : null}>
      {!user?.id ? <LoginRequired title="Mesajları görmek için giriş yap" text="Mesajlaşma hesabına bağlı çalışır." /> : loading ? <SkeletonBox lines={4} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? <EmptyState icon={MessageCircle} title="Henüz konuşma yok" text="Bir ilanın satıcısına mesaj attığında konuşma burada görünür." /> : <div className="grid gap-3">{items.map((item) => <button key={item.id} onClick={() => onOpenConversation?.(item)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><MessageCircle size={20}/></div><div className="min-w-0 flex-1"><div className="truncate font-black text-slate-900">{item.listings?.title || item.title || 'Konuşma'}</div><div className="mt-1 truncate text-sm text-slate-500">{item.last_message?.body || 'Son güncelleme'} · {item.updated_at ? new Date(item.updated_at).toLocaleString('tr-TR') : '-'}</div></div>{item.unread_count ? <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-black text-white">{item.unread_count}</span> : null}</button>)}</div>}
    </ModalShell>
  );
}
