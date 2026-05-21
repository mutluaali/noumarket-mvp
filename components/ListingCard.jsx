import { Heart, MapPin, Eye, Crown } from 'lucide-react';

function isPremiumActive(item) {
  if (!item?.isFeatured) return false;
  if (!item?.featuredUntil) return true;
  return new Date(item.featuredUntil).getTime() > Date.now();
}

export default function ListingCard({ item, onClick, onFavorite, isFavorite }) {
  const premiumActive = isPremiumActive(item);

  return (
    <article
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-3xl bg-white transition hover:-translate-y-1 ${
        premiumActive
          ? 'shadow-xl ring-2 ring-amber-300'
          : 'shadow-sm ring-1 ring-slate-200 hover:shadow-xl'
      }`}
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />

        {premiumActive ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-lg ring-2 ring-white/80">
            <Crown size={14} /> Premium
          </div>
        ) : (
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
            {item.badge}
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite?.(item);
          }}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur ${
            isFavorite ? 'bg-rose-600 text-white' : 'bg-white/90 text-slate-800'
          }`}
        >
          <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {item.category}
          </div>

          {premiumActive && (
            <div className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700 ring-1 ring-amber-200">
              Öne çıkan
            </div>
          )}
        </div>

        <h3 className="line-clamp-2 text-lg font-black">{item.title}</h3>
        <div className="mt-3 text-xl font-black">{item.priceText}</div>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <MapPin size={16} /> {item.location}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={15} /> {item.views}
          </span>
        </div>
      </div>
    </article>
  );
}
