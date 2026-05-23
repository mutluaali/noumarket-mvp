'use client';

import { useState } from 'react';
import { AlertTriangle, Send, X } from 'lucide-react';
import { createReport } from '@/lib/reports';

const REASONS = [
  { value: 'fraud', label: 'Dolandırıcılık / sahte ilan' },
  { value: 'wrong_info', label: 'Yanlış bilgi veya yanıltıcı fiyat' },
  { value: 'prohibited', label: 'Yasaklı / uygunsuz ürün' },
  { value: 'duplicate', label: 'Tekrarlanan ilan' },
  { value: 'other', label: 'Diğer' },
];

export default function ReportListingModal({ user, listing, onClose }) {
  const [reason, setReason] = useState('fraud');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!user?.id) {
      setErrorText('Şikayet göndermek için giriş yapmalısın.');
      return;
    }

    setSaving(true);
    setErrorText('');

    try {
      await createReport({
        reporterId: user.id,
        listingId: listing?.id,
        reason,
        details: details.trim(),
      });
      setSent(true);
    } catch (error) {
      setErrorText(error?.message || 'Şikayet gönderilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-100">
              <AlertTriangle size={14} /> Güvenlik bildirimi
            </div>
            <h2 className="mt-3 text-2xl font-black">İlanı şikayet et</h2>
            <p className="mt-1 text-sm text-slate-500">Şüpheli ilanları erken yakalamak platformun güvenini büyütür.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
        </div>

        {sent ? (
          <div className="rounded-3xl bg-emerald-50 p-5 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
            Bildirim alındı. Admin panelinde incelenecek.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Sebep</label>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-slate-400"
              >
                {REASONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Açıklama</label>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={5}
                placeholder="Ne gördün? Fiyat mı sahte, fotoğraf mı çalıntı, satıcı mı şüpheli?"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
              />
            </div>

            {errorText && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{errorText}</div>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Vazgeç</button>
              <button onClick={submit} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                <Send size={17} /> {saving ? 'Gönderiliyor...' : 'Şikayet gönder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
