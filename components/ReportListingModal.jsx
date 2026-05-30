'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Send, X } from 'lucide-react';
import { createReport, findOpenReportForListing, REPORT_REASON_LABELS } from '@/lib/reports';

const REASONS = Object.entries(REPORT_REASON_LABELS).map(([value, label]) => ({ value, label }));

export default function ReportListingModal({ user, listing, onClose }) {
  const [reason, setReason] = useState('fraud');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [sent, setSent] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    let mounted = true;

    async function checkExisting() {
      if (!user?.id || !listing?.id) {
        if (mounted) setCheckingExisting(false);
        return;
      }

      setCheckingExisting(true);
      try {
        const existing = await findOpenReportForListing({
          reporterId: user.id,
          listingId: listing.id,
        });
        if (mounted) setAlreadyReported(Boolean(existing));
      } catch (error) {
        console.warn('findOpenReportForListing:', error);
      } finally {
        if (mounted) setCheckingExisting(false);
      }
    }

    checkExisting();
    return () => {
      mounted = false;
    };
  }, [user?.id, listing?.id]);

  async function submit() {
    if (!user?.id) {
      setErrorText('Bu ilanı şikayet etmek için giriş yapmalısınız.');
      return;
    }

    if (alreadyReported) {
      setErrorText('Bu ilan için zaten açık bir şikayetin var.');
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
    <div className="fixed inset-0 z-[70] bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => onClose?.()}>
      <div onClick={(event) => event.stopPropagation()} className="mx-auto max-w-xl rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/20">
              <AlertTriangle size={14} /> Güvenlik bildirimi
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">İlanı şikayet et</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {listing?.title ? `"${listing.title}" ilanı hakkında bildirim gönder.` : 'Şüpheli ilanları erken yakalamak platformun güvenini büyütür.'}
            </p>
          </div>
          <button onClick={() => onClose?.()} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X /></button>
        </div>

        {checkingExisting ? (
          <div className="rounded-3xl bg-slate-50 p-5 text-sm font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            Mevcut şikayetler kontrol ediliyor...
          </div>
        ) : sent ? (
          <div className="rounded-3xl bg-emerald-50 p-5 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
            Şikayetiniz incelenmek üzere gönderildi.
          </div>
        ) : alreadyReported ? (
          <div className="rounded-3xl bg-amber-50 p-5 text-sm font-bold text-amber-900 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
            Bu ilan için zaten açık bir şikayetin var. Moderasyon incelemesi tamamlanana kadar yeni bildirim gönderemezsin.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Sebep</label>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={saving}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                {REASONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Açıklama (isteğe bağlı)</label>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={5}
                disabled={saving}
                placeholder="Ne gördün? Fiyat mı sahte, fotoğraf mı çalıntı, satıcı mı şüpheli?"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {errorText && <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-200">{errorText}</div>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => onClose?.()} disabled={saving} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">Vazgeç</button>
              <button onClick={submit} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={17} /> {saving ? 'Gönderiliyor...' : 'Şikayet gönder'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
