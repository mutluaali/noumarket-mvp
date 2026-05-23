'use client';

import { Bot, CheckCircle2, Lightbulb, ShieldAlert, Sparkles } from 'lucide-react';
import { buildListingAssistantDraft, getPricingHint, getTrustWarnings } from '@/lib/listingAssistant';

export default function ListingAssistantPanel({ form, imageCount = 0, onApplyDraft }) {
  const draft = buildListingAssistantDraft(form);
  const priceHint = getPricingHint(form);
  const warnings = getTrustWarnings(form, imageCount);

  return (
    <div className="rounded-[1.5rem] bg-indigo-50 p-4 ring-1 ring-indigo-100">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Bot size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black text-slate-950">Akıllı ilan asistanı</h4>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100">Beta</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">Başlık, açıklama, fiyat ve güven sinyallerini güçlendirir. AI altyapısına geçmeden önce güvenli kural tabanlı asistan olarak çalışır.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-indigo-100">
          <div className="mb-1 flex items-center gap-2 text-xs font-black text-slate-700"><Sparkles size={14} /> Önerilen başlık</div>
          <div className="text-sm font-black text-slate-950">{draft.title}</div>
        </div>

        <div className="rounded-2xl bg-white p-3 ring-1 ring-indigo-100">
          <div className="mb-1 flex items-center gap-2 text-xs font-black text-slate-700"><Lightbulb size={14} /> Fiyat yorumu</div>
          <p className="text-xs leading-5 text-slate-600">{priceHint}</p>
        </div>

        {warnings.length ? (
          <div className="rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-100">
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-rose-800"><ShieldAlert size={14} /> Düzeltmen gerekenler</div>
            <ul className="space-y-1 text-xs leading-5 text-rose-700">
              {warnings.map((warning) => <li key={warning}>• {warning}</li>)}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-800 ring-1 ring-emerald-100">
            <CheckCircle2 className="mr-1 inline" size={14} /> Güven sinyalleri iyi. Fotoğraf ve açıklama tarafı yayına uygun görünüyor.
          </div>
        )}

        <button
          type="button"
          onClick={() => onApplyDraft?.(draft)}
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
        >
          Önerilen başlık ve açıklamayı uygula
        </button>
      </div>
    </div>
  );
}
