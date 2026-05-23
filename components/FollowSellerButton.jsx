'use client';

import { useEffect, useState } from 'react';
import { BellPlus, CheckCircle2 } from 'lucide-react';
import { getStableSession } from '@/lib/supabase';
import { isFollowingSeller, toggleSellerFollow } from '@/lib/followSellers';

export default function FollowSellerButton({ sellerId }) {
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const session = await getStableSession();
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser?.id && sellerId) setFollowing(await isFollowingSeller(currentUser.id, sellerId));
    }
    load();
  }, [sellerId]);

  async function handleClick() {
    if (!user?.id) {
      alert('Satıcıyı takip etmek için giriş yapmalısınız.');
      return;
    }
    setLoading(true);
    try {
      setFollowing(await toggleSellerFollow(user.id, sellerId));
    } catch (error) {
      alert(error.message || 'Takip işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">
      {following ? <CheckCircle2 size={17} /> : <BellPlus size={17} />}
      {following ? 'Satıcı takipte' : 'Satıcıyı takip et'}
    </button>
  );
}
