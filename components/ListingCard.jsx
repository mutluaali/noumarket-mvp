'use client';

import { Heart, MapPin, Clock, Crown, ShieldCheck } from 'lucide-react';
import { formatXpf } from '@/lib/demoData';

export default function ListingCard({ item, onClick }) {
  const image = item.image || item.image_url || item.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80';
  return (
    <article onClick={onClick} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20 sm:rounded-3xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img src={image} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-80" />
        <button type="button" onClick={(e)=>e.stopPropagation()} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white shadow-sm backdrop-blur hover:bg-white/30 sm:right-3 sm:top-3"><Heart size={19}/></button>
        {item.isFeatured && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-cyan-500 px-2.5 py-1 text-[10px] font-black text-white"><Crown size={12}/> Premium</span>}
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-base font-black text-cyan-600 dark:text-cyan-300 sm:text-lg">{formatXpf ? formatXpf(item.price) : item.price}</div>
            <h3 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-black leading-5 text-slate-900 dark:text-white">{item.title}</h3>
          </div>
          {(item.trustScore || item.trust_score) >= 70 && <ShieldCheck className="mt-1 shrink-0 text-emerald-500" size={18}/>}        
        </div>
        <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1"><MapPin size={13}/> <span className="truncate">{item.location || 'Konum yok'}</span></div>
          <div className="flex items-center gap-1"><Clock size={13}/> <span>{item.createdAt || item.created_at || 'Yeni'}</span></div>
        </div>
      </div>
    </article>
  );
}
