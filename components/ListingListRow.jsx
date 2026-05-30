'use client';

import { Camera, CheckSquare, Clock3, Crown, Eye, Heart, MapPin, ShieldCheck, Square } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

function getAgeLabel(item) {
  const createdAt = item?.created_at ? new Date(item.created_at).getTime() : 0;
  if (!createdAt) return 'Yeni';
  const diffHours = Math.max(1, Math.round((Date.now() - createdAt) / 36e5));
  if (diffHours < 24) return `${diffHours} sa önce`;
  return `${Math.round(diffHours / 24)} gün önce`;
}

function imageCount(item) {
  if (Array.isArray(item?.images) && item.images.length) return item.images.length;
  return item?.image ? 1 : 0;
}

export default function ListingListRow({ item, onClick, onFavorite, isFavorite, onCompare, isCompared }) {
  return (
    <article onClick={onClick} className="group grid cursor-pointer grid-cols-[154px_1fr_190px] gap-4 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-400 hover:shadow-md">
      <div className="relative h-28 overflow-hidden rounded-lg bg-slate-100">
        <OptimizedImage src={item.image} alt={item.title} className="object-cover transition group-hover:scale-105" sizes="154px" />
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white"><Camera size={11} /> {imageCount(item)}</span>
        {item.isFeatured && <span className="absolute left-1.5 top-1.5 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-amber-950"><Crown size={10} className="inline" /> Öne çıkan</span>}
      </div>

      <div className="min-w-0 py-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
          <span>{item.category}</span>
          {item.subcategory ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">{item.subcategory}</span> : null}
          <span className="inline-flex items-center gap-1 normal-case tracking-normal"><Clock3 size={12} /> {getAgeLabel(item)}</span>
        </div>
        <h3 className="line-clamp-1 text-[16px] font-black text-slate-950 group-hover:underline">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">{item.description || 'Açıklama eklenmemiş.'}</p>
        <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin size={13} /> {item.location}</span>
          <span className="inline-flex items-center gap-1"><Eye size={13} /> {item.views || 0}</span>
          <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck size={13} /> Onaylı</span>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between border-l border-slate-100 py-1 pl-4">
        <div className="text-right">
          <div className="text-xl font-black tracking-tight text-slate-950">{item.priceText}</div>
          <div className="mt-0.5 text-[11px] font-bold text-slate-400">No: {String(item.id || '').slice(0, 8)}</div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={(event) => { event.stopPropagation(); onFavorite?.(item); }} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${isFavorite ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:text-rose-600'}`} aria-label="Favorilere ekle">
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onCompare?.(item); }} className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-xs font-black ${isCompared ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-950 hover:text-white'}`} aria-label="Karşılaştırmaya ekle">
            {isCompared ? <CheckSquare size={14} /> : <Square size={14} />} Kıyasla
          </button>
        </div>
      </div>
    </article>
  );
}
