import { Rocket, CheckCircle2 } from 'lucide-react';

const checks = [
  'NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY Vercel Environment Variables içine girildi.',
  'STRIPE_SECRET_KEY ve STRIPE_WEBHOOK_SECRET production ortamında tanımlandı.',
  'NEXT_PUBLIC_SITE_URL canlı domain ile güncellendi.',
  'Supabase Auth redirect URL listesine production domain eklendi.',
  'Storage bucket: listing-images public read + authenticated upload policy aktif.',
];

export default function DeployChecklist() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15"><Rocket size={15} /> Production hazırlığı</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight">Vercel’e çıkmadan önce kontrol listesi</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Bu blok geliştirme modunda da görünür; gerçek yayına geçerken eksik env/policy hatalarını azaltmak için eklendi.</p>
          </div>
          <div className="grid gap-2 p-5">
            {checks.map((check) => (
              <div key={check} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                <span>{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
