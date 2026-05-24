'use client';

import { Heart, MapPin, Clock, Crown, ShieldCheck } from 'lucide-react';
import { formatXpf } from '@/lib/demoData';

export default function ListingCard({ item, onClick }) {
  const image = item.image || item.image_url || item.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80';
  return (
    <article onClick={onClick} className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={image} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <button type="button" onClick={(e)=>e.stopPropagation()} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:text-rose-600"><Heart size={19}/></button>
        {item.isFeatured && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-amber-950"><Crown size={12}/> Premium</span>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-lg font-black text-blue-600">{formatXpf ? formatXpf(item.price) : item.price}</div>
            <h3 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-black leading-5 text-slate-900">{item.title}</h3>
          </div>
          {(item.trustScore || item.trust_score) >= 70 && <ShieldCheck className="mt-1 shrink-0 text-emerald-500" size={18}/>}        
        </div>
        <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1"><MapPin size={13}/> <span className="truncate">{item.location || 'Konum yok'}</span></div>
          <div className="flex items-center gap-1"><Clock size={13}/> <span>{item.createdAt || item.created_at || 'Yeni'}</span></div>
        </div>
      </div>
    </article>
  );
}
