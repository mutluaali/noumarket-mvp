import { Heart, MapPin, Eye, Crown, Camera, Clock3, Square, CheckSquare } from 'lucide-react';

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
      className={`group cursor-pointer overflow-hidden rounded-[2rem] bg-white transition duration-300 hover:-translate-y-1 ${
        premiumActive
          ? 'shadow-xl ring-2 ring-amber-300'
          : 'shadow-sm ring-1 ring-slate-200 hover:shadow-xl'
      }`}
    >
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/60 to-transparent" />

        {premiumActive ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-lg ring-2 ring-white/80">
            <Crown size={14} /> Premium
          </div>
        ) : (
          <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
            {item.badge || 'Yeni ilan'}
          </div>
        )}

        <button
          type="button"
          aria-label="Favorilere ekle"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite?.(item);
          }}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow-sm backdrop-blur transition active:scale-95 ${
            isFavorite ? 'bg-rose-600 text-white' : 'bg-white/92 text-slate-800 hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          aria-label="Karşılaştırmaya ekle"
          onClick={(event) => {
            event.stopPropagation();
            onCompare?.(item);
          }}
          className={`absolute right-3 top-16 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black shadow-sm backdrop-blur transition active:scale-95 ${
            isCompared ? 'bg-slate-950 text-white' : 'bg-white/92 text-slate-800 hover:bg-slate-950 hover:text-white'
          }`}
        >
          {isCompared ? <CheckSquare size={14} /> : <Square size={14} />} Kıyasla
        </button>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-bold text-white">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-2.5 py-1 backdrop-blur"><Camera size={13} /> {count}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/65 px-2.5 py-1 backdrop-blur"><Clock3 size={13} /> {getAgeLabel(item)}</span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">
            {item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}
          </div>

          {premiumActive && (
            <div className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700 ring-1 ring-amber-200">
              Üst sıra
            </div>
          )}
        </div>

        <h3 className="line-clamp-2 min-h-[3.2rem] text-lg font-black leading-snug text-slate-950">{item.title}</h3>
        <div className="mt-3 text-2xl font-black tracking-tight">{item.priceText}</div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span className="flex min-w-0 items-center gap-2">
            <MapPin size={16} className="shrink-0" /> <span className="truncate">{item.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye size={15} /> {item.views || 0}
          </span>
        </div>
      </div>
    </article>
  );
}
