import { Camera, ImageOff } from 'lucide-react';

export default function ListingImageFallback({
  className = '',
  compact = false,
  label = 'Fotoğraf yok',
  secondaryLabel = 'Fotoğraf bulunmuyor',
}) {
  const Icon = compact ? ImageOff : Camera;

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 text-white ${className}`}
      role="img"
      aria-label={label}
    >
      <Icon size={compact ? 28 : 44} className="text-white/50" aria-hidden="true" />
      <p className={`mt-3 font-black text-white/80 ${compact ? 'text-[11px]' : 'text-sm'}`}>{label}</p>
      {!compact && secondaryLabel ? (
        <p className="mt-1 text-xs font-semibold text-white/55">{secondaryLabel}</p>
      ) : null}
    </div>
  );
}
