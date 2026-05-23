'use client';

import { useEffect, useState } from 'react';
import { X, Save, User, Phone, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { getCurrentProfile, upsertCurrentProfile } from '@/lib/profiles';

export default function ProfileModal({ user, profile, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const row = await getCurrentProfile(user.id);
        if (!alive) return;
        setForm({
          full_name: row?.full_name || '',
          phone: row?.phone || '',
        });
      } catch (error) {
        if (!alive) return;
        setErrorText(error?.message || 'Profil bilgileri alınamadı.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile() {
    if (!user?.id) {
      setErrorText('Profil kaydetmek için giriş yapmalısın.');
      return;
    }

    setSaving(true);
    setErrorText('');

    try {
      const saved = await upsertCurrentProfile(user.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
      });
      await onSaved?.(saved);
      onClose?.();
    } catch (error) {
      setErrorText(error?.message || 'Profil kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Profilim</h2>
            <p className="mt-1 text-sm text-slate-500">Satıcı bilgilerini burada sabitle. İlan verirken otomatik kullanılacak.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Profil yükleniyor...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><Mail size={15} /> Hesap e-postası</div>
              <div className="truncate text-sm font-bold text-slate-900">{user?.email || 'E-posta bulunamadı'}</div>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><User size={16} /> Ad Soyad / Mağaza adı</span>
              <input
                value={form.full_name}
                onChange={(event) => update('full_name', event.target.value)}
                placeholder="Ali Mutlu veya Nouméa Auto"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={16} /> Telefon / WhatsApp</span>
              <input
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="+687 ..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
              />
            </label>

            <div className="rounded-3xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
              <div className="flex items-center gap-2 font-black"><ShieldCheck size={17} /> Güven etkisi</div>
              <p className="mt-1 text-emerald-700">Dolgun profil + doğru telefon, ilan dönüşümünü ciddi artırır. Boş satıcı profili marketplace’te güven kırar.</p>
            </div>

            {errorText && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
                <AlertCircle size={17} /> {errorText}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Vazgeç</button>
              <button onClick={saveProfile} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                <Save size={17} /> {saving ? 'Kaydediliyor...' : 'Profili kaydet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
