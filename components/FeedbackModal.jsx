'use client';

import { useState } from 'react';
import { Bug, Lightbulb, MessageSquare, Send, X } from 'lucide-react';
import { createFeedbackReport } from '@/lib/feedback';

const TYPES = [
  { value: 'bug', label: 'Hata', icon: Bug },
  { value: 'idea', label: 'Fikir', icon: Lightbulb },
  { value: 'feedback', label: 'Yorum', icon: MessageSquare },
];

export default function FeedbackModal({ user, onClose }) {
  const [type, setType] = useState('bug');
  const [severity, setSeverity] = useState('normal');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (saving) return;
    setSaving(true);
    try {
      await createFeedbackReport({
        userId: user?.id,
        type,
        severity,
        message,
        pageUrl: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        metadata: {
          viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
        },
      });
      setSuccess(true);
      setMessage('');
    } catch (error) {
      alert(error.message || 'Geri bildirim kaydedilemedi. SQL dosyasını çalıştırdığını kontrol et.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
              Beta geri bildirim
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Bir sorun ya da fikir bildir</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Canlı test döneminde her hata raporu ürün kalitesini doğrudan artırır.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <div className="text-lg font-black">Kaydedildi.</div>
            <p className="mt-1 text-sm font-semibold">Bu kayıt admin tarafında incelenebilir. Test kullanıcıları için bu akış kritik.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setSuccess(false)} className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white">Yeni bildirim gönder</button>
              <button onClick={onClose} className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900">Kapat</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="grid gap-2 sm:grid-cols-3">
              {TYPES.map((item) => {
                const Icon = item.icon;
                const active = type === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setType(item.value)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    <Icon size={17} /> {item.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wide text-slate-500">Öncelik</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-slate-950">
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="critical">Kritik / kullanıcıyı engelliyor</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wide text-slate-500">Açıklama</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Ne oldu? Hangi sayfada? Hangi butona bastın? Beklenen sonuç neydi?"
                className="mt-2 w-full resize-none rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold outline-none focus:border-slate-950 focus:bg-white"
              />
              <div className="mt-2 text-xs font-semibold text-slate-400">Sayfa URL’i ve cihaz bilgisi otomatik eklenir.</div>
            </div>

            <button onClick={submit} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg disabled:opacity-60">
              <Send size={18} /> {saving ? 'Kaydediliyor...' : 'Gönder'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
