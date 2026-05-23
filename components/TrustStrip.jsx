import { ShieldCheck, Zap, MessageCircle, BadgeCheck } from 'lucide-react';

const items = [
  { icon: ShieldCheck, title: 'Admin kontrollü ilan', text: 'Şüpheli ve spam ilanlar yayına alınmadan elenir.' },
  { icon: Zap, title: 'Hızlı keşif', text: 'Kategori, fiyat ve konum filtreleri mobilde de hızlı çalışır.' },
  { icon: MessageCircle, title: 'Gerçek zamanlı mesaj', text: 'Alıcı ve satıcı platform içinden güvenli iletişim kurar.' },
  { icon: BadgeCheck, title: 'Premium vitrin', text: 'Öne çıkan ilanlar daha yüksek görünürlük alır.' },
];

export default function TrustStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-3 rounded-[2rem] bg-slate-950 p-3 shadow-2xl md:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-[1.55rem] bg-white/8 p-4 text-white ring-1 ring-white/10 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-950"><Icon size={20} /></div>
            <div className="mt-3 text-sm font-black">{title}</div>
            <p className="mt-1 text-xs leading-5 text-slate-300">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
