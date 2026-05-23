'use client';

import { Heart, MessageCircle, PlusCircle, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getActivationState, getReturningUserState } from '@/lib/onboarding';

export default function ActivationNudges({ user, listingCount = 0, onCreate, onFavorites, onMessages }) {
  const [visible, setVisible] = useState(false);
  const [returning, setReturning] = useState({ isReturning: false, daysAway: 0 });
  const [activation, setActivation] = useState({ firstFavoriteDone: true, firstMessageDone: true });

  useEffect(() => {
    setReturning(getReturningUserState());
    setActivation(getActivationState());
    const dismissed = window.localStorage.getItem('noumarket_activation_nudge_v25_dismissed') === 'done';
    setVisible(!dismissed);
  }, []);

  if (!visible) return null;

  const cards = [];

  if (returning.isReturning) {
    cards.push({
      icon: RotateCcw,
      title: `${returning.daysAway} gün sonra tekrar hoş geldin`,
      text: 'Yeni ilanlara hızlıca bak. Geri dönen kullanıcı için en iyi aksiyon arama/favori kontrolüdür.',
      action: 'İlanlara bak',
      onClick: () => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if (!activation.firstFavoriteDone) {
    cards.push({
      icon: Heart,
      title: 'İlk favorini ekle',
      text: 'Favori davranışı retention için güçlü sinyal. Beğendiğin bir ilanı kaydet.',
      action: 'Favorilerim',
      onClick: onFavorites,
    });
  }

  if (user && !activation.firstMessageDone) {
    cards.push({
      icon: MessageCircle,
      title: 'İlk mesajını gönder',
      text: 'Satıcıyla konuşma başladığında platform gerçek değer üretir.',
      action: 'Mesajlarım',
      onClick: onMessages,
    });
  }

  if (user && listingCount === 0) {
    cards.push({
      icon: PlusCircle,
      title: 'İlk ilanını yayınla',
      text: 'Boş marketplace ölür. Kaliteli yerel ilanlar platformu büyütür.',
      action: 'İlan ver',
      onClick: onCreate,
    });
  }

  const visibleCards = cards.slice(0, 2);
  if (!visibleCards.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="relative rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-4 shadow-sm">
        <button
          onClick={() => {
            window.localStorage.setItem('noumarket_activation_nudge_v25_dismissed', 'done');
            setVisible(false);
          }}
          className="absolute right-4 top-4 rounded-full bg-white p-2 text-slate-400 shadow-sm hover:text-slate-700"
        >
          <X size={16} />
        </button>
        <div className="grid gap-3 pr-10 md:grid-cols-2">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="flex items-center justify-between gap-4 rounded-3xl bg-white/80 p-4 ring-1 ring-white/70 backdrop-blur">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">{card.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{card.text}</p>
                  </div>
                </div>
                <button onClick={card.onClick} className="hidden rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 sm:block">
                  {card.action}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
