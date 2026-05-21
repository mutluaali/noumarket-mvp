import { Crown } from 'lucide-react';

export default function PremiumBadge({ listing }) {
  const active = listing?.isFeatured || listing?.is_featured;
  if (!active) return null;

  let text = 'Premium';
  const until = listing?.featured_until || listing?.featuredUntil;

  if (until) {
    const days = Math.ceil((new Date(until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days > 0) text = `Premium · ${days} gün`;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 ring-1 ring-amber-200">
      <Crown size={13} /> {text}
    </span>
  );
}
