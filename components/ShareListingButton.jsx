'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

export default function ShareListingButton({ title }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'NouMarket ilanı', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch (error) {
      console.warn('share cancelled or failed:', error);
    }
  }

  return (
    <button onClick={share} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100">
      {copied ? <Check size={17} /> : <Share2 size={17} />}
      {copied ? 'Link kopyalandı' : 'İlanı paylaş'}
    </button>
  );
}
