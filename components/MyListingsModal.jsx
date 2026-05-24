'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalizeListing } from '@/lib/listings';
import ListingCard from '@/components/ListingCard';
import { ModalShell, SkeletonBox, EmptyState, ErrorState, LoginRequired } from '@/components/AsyncState';
import { getErrorMessage, withTimeout } from '@/lib/safeAsync';

export default function MyListingsModal({ user, onClose, onOpenListing }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data, error: queryError } = await withTimeout(
        supabase.from('listings').select('*, listing_images(image_url, sort_order)').eq('user_id', user.id).order('created_at', { ascending: false }),
        8000,
        'İlanlarım sorgusu çok uzun sürdü. Supabase/RLS ayarlarını kontrol et.'
      );
      if (queryError) throw queryError;
      setItems((data || []).map(normalizeListing));
    } catch (err) {
      console.error('MyListingsModal:', err);
      setError(getErrorMessage(err, 'İlanların yüklenemedi.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <ModalShell eyebrow="İlanlarım" title="Yayın ve onay durumun" subtitle="Eklediğin ilanların durumunu burada takip edebilirsin." onClose={onClose} action={user?.id ? <button onClick={load} className="hidden items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-slate-200 md:inline-flex"><RefreshCw size={16}/> Yenile</button> : null}>
      {!user?.id ? <LoginRequired title="İlanlarını görmek için giriş yap" text="İlan yönetimi hesabına bağlı çalışır." /> : loading ? <SkeletonBox lines={4} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? <EmptyState icon={ClipboardList} title="Henüz ilan vermedin" text="İlk ilanını eklediğinde burada onay durumunu göreceksin." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <ListingCard key={item.id} item={item} onClick={() => onOpenListing?.(item)} />)}</div>}
    </ModalShell>
  );
}
