import { Heart, MapPin, Crown, Camera, Clock3, Square, CheckSquare } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

function isPremiumActive(item) {
  if (!item?.isFeatured) return false;
  if (!item?.featuredUntil) return true;
  return new Date(item.featuredUntil).getTime() > Date.now();
}

function imageCount(item) {
  if (Array.isArray(item?.images) && item.images.length) return item.images.length;
  return item?.image ? 1 : 0;
}

function getAgeLabel(item) {
  const createdAt = item?.created_at ? new Date(item.created_at).getTime() : 0;
  if (!createdAt) return 'Yeni';
  const diffHours = Math.max(1, Math.round((Date.now() - createdAt) / 36e5));
  if (diffHours < 24) return `${diffHours} sa önce`;
  const days = Math.round(diffHours / 24);
  return `${days} gün önce`;
}

export default function ListingCard({ item, onClick, onFavorite, isFavorite, onCompare, isCompared }) {
  const premiumActive = isPremiumActive(item);
  const count = imageCount(item);

  return (
    <article
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-[1.65rem] bg-white transition duration-200 hover:-translate-y-0.5 ${
        premiumActive ? 'shadow-md ring-2 ring-amber-300' : 'shadow-sm ring-1 ring-slate-200 hover:shadow-lg'
      }`}
    >
      <div className="relative h-52 overflow-hidden bg-slate-100 sm:h-56">
        <OptimizedImage
          src={item.image}
          alt={item.title}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/55 to-transparent" />

        <div className="absolute left-3 top-3 flex gap-2">
          {premiumActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-sm ring-2 ring-white/80"><Crown size={13} /> Premium</span>
          ) : (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">{item.badge || 'Yeni'}</span>
          )}
        </div>

        <button
          type="button"
          aria-label="Favorilere ekle"
          onClick={(event) => { event.stopPropagation(); onFavorite?.(item); }}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow-sm backdrop-blur transition active:scale-95 ${
            isFavorite ? 'bg-rose-600 text-white' : 'bg-white/92 text-slate-800 hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          aria-label="Karşılaştırmaya ekle"
          onClick={(event) => { event.stopPropagation(); onCompare?.(item); }}
          className={`absolute right-3 top-16 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition active:scale-95 ${
            isCompared ? 'bg-slate-950 text-white' : 'bg-white/92 text-slate-800 hover:bg-slate-950 hover:text-white'
          }`}
          title="Kıyasla"
        >
          {isCompared ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-bold text-white">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-2.5 py-1 backdrop-blur"><Camera size={13} /> {count}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-2.5 py-1 backdrop-blur"><Clock3 size={13} /> {getAgeLabel(item)}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="truncate text-xs font-black uppercase tracking-wide text-slate-500">{item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}</div>
          {premiumActive && <div className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700 ring-1 ring-amber-200">Üst sıra</div>}
        </div>

        <h3 className="line-clamp-2 min-h-[2.8rem] text-base font-black leading-snug text-slate-950 sm:text-lg">{item.title}</h3>
        <div className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{item.priceText}</div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span className="flex min-w-0 items-center gap-2"><MapPin size={16} className="shrink-0" /> <span className="truncate">{item.location}</span></span>
          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-100">Detay</span>
        </div>
      </div>
    </article>
  );
}
