'use client';

import { Camera, Crown, Eye, Heart, MapPin, Clock3, Square, CheckSquare } from 'lucide-react';
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
    <article
      onClick={onClick}
      className="group grid cursor-pointer gap-4 rounded-[1.7rem] bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg md:grid-cols-[190px_1fr_auto]"
    >
      <div className="relative h-44 overflow-hidden rounded-[1.35rem] bg-slate-100 md:h-36">
        <OptimizedImage src={item.image} alt={item.title} className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 190px" />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <Camera size={13} /> {imageCount(item)}
        </span>
        {item.isFeatured && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-amber-950 shadow">
            <Crown size={13} /> Doping
          </span>
        )}
      </div>

      <div className="min-w-0 px-1 py-1">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
          <span>{item.category}</span>
          {item.subcategory ? <span className="rounded-full bg-slate-100 px-2 py-1">{item.subcategory}</span> : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 normal-case tracking-normal"><Clock3 size={12} /> {getAgeLabel(item)}</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-black text-slate-950">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description || 'Açıklama eklenmemiş.'}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin size={15} /> {item.location}</span>
          <span className="inline-flex items-center gap-1"><Eye size={15} /> {item.views || 0}</span>
          {item.condition ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">{item.condition}</span> : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-3 md:min-w-[190px] md:flex-col md:items-end md:justify-between md:border-l md:border-t-0 md:py-2 md:pl-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFavorite?.(item);
            }}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 ring-slate-200 ${isFavorite ? 'bg-rose-600 text-white' : 'bg-white text-slate-700 hover:text-rose-600'}`}
            aria-label="Favorilere ekle"
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCompare?.(item);
            }}
            className={`inline-flex h-11 items-center gap-1 rounded-full px-3 text-xs font-black shadow-sm ring-1 ring-slate-200 ${isCompared ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 hover:bg-slate-950 hover:text-white'}`}
            aria-label="Karşılaştırmaya ekle"
          >
            {isCompared ? <CheckSquare size={15} /> : <Square size={15} />} Kıyasla
          </button>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-tight text-slate-950">{item.priceText}</div>
          <div className="mt-1 text-xs font-bold text-slate-400">İlan no: {String(item.id || '').slice(0, 8)}</div>
        </div>
      </div>
    </article>
  );
}
