'use client';

import { Rocket, ShieldCheck, Smartphone, Search, MessageCircle } from 'lucide-react';

const items = [
  { icon: ShieldCheck, title: 'Güven', text: 'Doğrulanmış profil, yorum, şikayet ve moderasyon akışı aktif tutulmalı.' },
  { icon: Smartphone, title: 'Mobil', text: 'İlan verme ve mesajlaşma mobilde 3 dokunuş içinde tamamlanmalı.' },
  { icon: Search, title: 'Keşif', text: 'Kategori, lokasyon, akıllı feed ve kayıtlı arama blokları canlı tutulmalı.' },
  { icon: MessageCircle, title: 'Likidite', text: 'İlk 100 ilan ve ilk 20 aktif satıcı olmadan reklam bütçesi yakılmamalı.' },
];

export default function LaunchReadinessPanel() {
  return (
    <section className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-sm md:p-7">
      <div className="flex items-center gap-2 text-xl font-black"><Rocket size={22} /> Launch readiness</div>
      <p className="mt-2 text-sm leading-6 text-slate-300">Beta kullanıcıya açmadan önce her hafta kontrol edilecek operasyon kartları.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl bg-white/8 p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-2 font-black"><Icon size={17} /> {title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
