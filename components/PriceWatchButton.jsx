'use client';

import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { getStableSession } from '@/lib/supabase';
import { isWatchingPrice, togglePriceWatch } from '@/lib/priceWatch';

export default function PriceWatchButton({ listingId, currentPrice }) {
  const [user, setUser] = useState(null);
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const session = await getStableSession();
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser?.id && listingId) setWatching(await isWatchingPrice(currentUser.id, listingId));
    }
    load();
  }, [listingId]);

  async function handleClick() {
    if (!user?.id) {
      alert('Fiyat alarmı için giriş yapmalısınız.');
      return;
    }
    setLoading(true);
    try {
      setWatching(await togglePriceWatch({ userId: user.id, listingId, currentPrice }));
    } catch (error) {
      alert(error.message || 'Fiyat alarmı kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50">
      {watching ? <CheckCircle2 size={17} /> : <BellRing size={17} />}
      {watching ? 'Fiyat alarmı açık' : 'Fiyat düşünce haber ver'}
    </button>
  );
}
