'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { normalizeListing } from '@/lib/listings';
import ListingCard from '@/components/ListingCard';
import { ModalShell, SkeletonBox, EmptyState, ErrorState, LoginRequired } from '@/components/AsyncState';
import { getErrorMessage } from '@/lib/safeAsync';
import { getFavoriteListings } from '@/lib/favorites';

export default function FavoritesModal({ user, onClose, onOpenListing }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const data = await getFavoriteListings();
      const normalized = (data || []).filter(Boolean).map(normalizeListing);
      setItems(normalized);
    } catch (err) {
      setError(getErrorMessage(err, 'Favoriler yüklenemedi.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <ModalShell eyebrow="♥ Favorilerim" title="Favori ilanların" subtitle="Kaydettiğin ilanlar burada görünür." onClose={onClose} action={user?.id ? <button onClick={load} className="hidden items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-slate-200 md:inline-flex"><RefreshCw size={16}/> Yenile</button> : null}>
      {!user?.id ? <LoginRequired title="Favorilerini görmek için giriş yap" text="Favori ilanlar hesabına bağlı tutulur." /> : loading ? <SkeletonBox lines={3} /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? <EmptyState icon={Heart} title="Henüz favori ilan yok" text="Beğendiğin ilanları kalp ikonuyla favorilerine ekleyebilirsin." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <ListingCard key={item.id} item={item} onClick={() => onOpenListing?.(item)} />)}</div>}
    </ModalShell>
  );
}
