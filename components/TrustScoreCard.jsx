'use client';

import { CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { calculateProfileTrust } from '@/lib/trust';

function colorClasses(color) {
  if (color === 'emerald') return 'bg-emerald-50 text-emerald-800 ring-emerald-100';
  if (color === 'amber') return 'bg-amber-50 text-amber-800 ring-amber-100';
  return 'bg-red-50 text-red-800 ring-red-100';
}

export default function TrustScoreCard({ profile, user }) {
  const trust = calculateProfileTrust(profile, user);
  const Icon = trust.score >= 55 ? ShieldCheck : AlertTriangle;

  return (
    <div className={`rounded-3xl p-4 ring-1 ${colorClasses(trust.color)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black"><Icon size={18} /> Güven skoru</div>
          <p className="mt-1 text-xs font-semibold opacity-80">Profil ne kadar doluysa ilan dönüşümü o kadar artar.</p>
        </div>
        <div className="rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm">
          <div className="text-2xl font-black">{trust.score}</div>
          <div className="text-[11px] font-black uppercase tracking-wide">{trust.level}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {trust.checks.map((check) => (
          <div key={check.key} className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold">
            <CheckCircle2 size={15} className={check.ok ? 'text-emerald-600' : 'text-slate-300'} />
            <span className={check.ok ? '' : 'text-slate-400'}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
