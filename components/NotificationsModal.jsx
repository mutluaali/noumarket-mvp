'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ModalShell, SkeletonBox, EmptyState, ErrorState, LoginRequired } from '@/components/AsyncState';
import { getErrorMessage, withTimeout } from '@/lib/safeAsync';

export default function NotificationsModal({ user, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data, error: queryError } = await withTimeout(
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        8000,
        'Bildirim sorgusu çok uzun sürdü. Supabase/RLS ayarlarını kontrol et.'
      );
      if (queryError) throw queryError;
      setItems(data || []);
    } catch (err) {
      console.error('NotificationsModal:', err);
      setError(getErrorMessage(err, 'Bildirimler yüklenemedi.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <ModalShell eyebrow="Bildirimler" title="Son bildirimlerin" subtitle="İlan, mesaj ve sistem bildirimleri burada görünür." onClose={onClose} action={user?.id ? <button onClick={load} className="hidden items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-slate-200 md:inline-flex"><RefreshCw size={16}/> Yenile</button> : null}>
      {!user?.id ? <LoginRequired title="Bildirimleri görmek için giriş yap" /> : loading ? <SkeletonBox lines={4} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? <EmptyState icon={Bell} title="Bildirim yok" text="Yeni mesaj veya ilan hareketi olduğunda burada görünecek." /> : <div className="grid gap-3">{items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="font-black text-slate-900">{item.title || 'Bildirim'}</div><p className="mt-1 text-sm text-slate-500">{item.body || item.message || 'Detay yok.'}</p></div>)}</div>}
    </ModalShell>
  );
}
