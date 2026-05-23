'use client';

import { CheckCircle2, Heart, MessageCircle, Search, Sparkles, X } from 'lucide-react';
import { completeOnboarding } from '@/lib/onboarding';

const steps = [
  {
    icon: Search,
    title: 'Önce doğru ilanı bul',
    text: 'Araç, emlak, elektronik veya denizcilik ilanlarını kategori, fiyat ve konuma göre filtrele.',
  },
  {
    icon: Heart,
    title: 'Favorilere ekle',
    text: 'İlgilendiğin ilanları kaybetme. Fiyat düşüşü ve yeni eşleşme bildirimleri için altyapı hazır.',
  },
  {
    icon: MessageCircle,
    title: 'Satıcıyla hızlı iletişim kur',
    text: 'İlan detayından satıcıya mesaj gönder. Marketplace’in gerçek değeri hızlı iletişimde.',
  },
  {
    icon: Sparkles,
    title: 'Sen de ilan ver',
    text: 'İlk kaliteli ilan, platformun büyüme motorudur. Fotoğraf, açıklama ve fiyatı güçlü gir.',
  },
];

export default function OnboardingModal({ onClose, onCreateListing }) {
  function finish() {
    completeOnboarding();
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-white/60">
        <button onClick={finish} className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
          <X size={18} />
        </button>

        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-blue-100 ring-1 ring-white/15">
              <CheckCircle2 size={15} /> NouMarket beta
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight">Yeni Kaledonya ilan pazarına hoş geldin.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Buradaki hedef basit: sahibinden.com mantığını yerel pazara daha hızlı, daha temiz ve daha güvenli şekilde uyarlamak.
            </p>
            <button
              onClick={() => {
                finish();
                onCreateListing?.();
              }}
              className="mt-7 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg hover:bg-blue-50"
            >
              İlk ilanımı vereyim
            </button>
          </div>

          <div className="p-6 md:p-7">
            <div className="space-y-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-950">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={finish} className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
                Başla
              </button>
              <button onClick={finish} className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                Sonra bakarım
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
