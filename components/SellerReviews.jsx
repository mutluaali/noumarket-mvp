'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { getSellerReviews, createSellerReview } from '@/lib/reviews';
import { getStableSession } from '@/lib/supabase';

export default function SellerReviews({ sellerId }) {
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length;
  }, [reviews]);

  async function load() {
    const session = await getStableSession();
    setUser(session?.user || null);
    setReviews(await getSellerReviews(sellerId));
  }

  useEffect(() => { load(); }, [sellerId]);

  async function submitReview() {
    if (!user?.id) {
      alert('Yorum bırakmak için giriş yapmalısınız.');
      return;
    }
    setSaving(true);
    try {
      await createSellerReview({ sellerId, buyerId: user.id, rating, comment });
      setComment('');
      await load();
    } catch (error) {
      alert(error.message || 'Yorum kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Satıcı yorumları</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Güvenli alışveriş için topluluk puanı.</p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right ring-1 ring-amber-200">
          <div className="flex items-center gap-1 text-lg font-black text-amber-700"><Star size={18} fill="currentColor" /> {average ? average.toFixed(1) : '—'}</div>
          <div className="text-xs font-black text-amber-700">{reviews.length} yorum</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 md:grid-cols-[160px_1fr_auto]">
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black">
          {[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} yıldız</option>)}
        </select>
        <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Kısa yorum yazın" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900" />
        <button onClick={submitReview} disabled={saving} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? 'Kaydediliyor' : 'Yorumla'}</button>
      </div>

      <div className="mt-5 space-y-3">
        {reviews.length ? reviews.map((review) => (
          <div key={review.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-center gap-1 text-sm font-black text-amber-600">{Array.from({ length: Number(review.rating || 0) }).map((_, index) => <Star key={index} size={15} fill="currentColor" />)}</div>
            {review.comment && <p className="mt-2 text-sm leading-6 text-slate-700">{review.comment}</p>}
          </div>
        )) : <div className="rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Henüz yorum yok.</div>}
      </div>
    </section>
  );
}
