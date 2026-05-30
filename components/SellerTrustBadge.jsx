'use client';

import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { calculateListingTrust } from '@/lib/trust';

export default function SellerTrustBadge({ listing }) {
  const trust = calculateListingTrust(listing);
  const strong = trust.color === 'emerald';
  const warn = trust.color === 'amber';
  const cls = strong
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : warn
      ? 'bg-amber-50 text-amber-700 ring-amber-100'
      : 'bg-red-50 text-red-700 ring-red-100';
  const Icon = strong || warn ? ShieldCheck : AlertTriangle;

  return (
    <div className={`rounded-2xl p-3 text-xs font-bold ring-1 ${cls}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2"><Icon size={15} /> Güven skoru · {trust.level}</span>
        <span>{trust.score}/100</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] opacity-80">
        <span>{trust.checks.phoneOk ? 'Telefon var' : 'Telefon eksik'}</span>
        <span>{trust.checks.hasImages ? 'Fotoğraf var' : 'Fotoğraf eksik'}</span>
        <span>{trust.checks.hasDescription ? 'Açıklama iyi' : 'Açıklama zayıf'}</span>
        <span>{trust.checks.hasLocation ? 'Konum var' : 'Konum eksik'}</span>
      </div>
    </div>
  );
}
