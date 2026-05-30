'use client';

import { useEffect, useState } from 'react';
import { X, Save, User, Phone, Mail, ShieldCheck, AlertCircle, MapPin, Store, FileText, BadgeCheck, Clock3 } from 'lucide-react';
import { getCurrentProfile, upsertCurrentProfile, requestPhoneVerification } from '@/lib/profiles';
import TrustScoreCard from '@/components/TrustScoreCard';

export default function ProfileModal({ user, profile, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    store_name: profile?.store_name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    phone_verified: profile?.phone_verified || false,
    phone_verification_requested_at: profile?.phone_verification_requested_at || null,
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 7000));
        const row = await Promise.race([getCurrentProfile(user.id), timeout]);
        if (!alive) return;
        setForm({
          full_name: row?.full_name || '',
          store_name: row?.store_name || '',
          phone: row?.phone || '',
          location: row?.location || '',
          bio: row?.bio || '',
          avatar_url: row?.avatar_url || '',
          phone_verified: row?.phone_verified || false,
          phone_verification_requested_at: row?.phone_verification_requested_at || null,
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
    setSuccessText('');

    try {
      const saved = await upsertCurrentProfile(user.id, {
        full_name: form.full_name.trim(),
        store_name: form.store_name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        avatar_url: form.avatar_url.trim(),
      });
      setSuccessText('Profil güncellendi.');
      await onSaved?.(saved);
      window.setTimeout(() => onClose?.(), 1200);
    } catch (error) {
      setErrorText(error?.message || 'Profil kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }


  async function requestPhoneCheck() {
    if (!user?.id) {
      setErrorText('Telefon doğrulaması için giriş yapmalısın.');
      return;
    }

    setVerifyingPhone(true);
    setErrorText('');

    try {
      const saved = await requestPhoneVerification(user.id, form.phone);
      setForm((current) => ({
        ...current,
        phone: saved?.phone || current.phone,
        phone_verified: Boolean(saved?.phone_verified),
        phone_verification_requested_at: saved?.phone_verification_requested_at || new Date().toISOString(),
      }));
      await onSaved?.(saved);
    } catch (error) {
      setErrorText(error?.message || 'Telefon doğrulama isteği oluşturulamadı.');
    } finally {
      setVerifyingPhone(false);
    }
  }

  const previewProfile = { ...(profile || {}), ...form };
  const phoneRequested = Boolean(form.phone_verification_requested_at);
  const phoneVerified = Boolean(form.phone_verified || profile?.phone_verified);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-3xl overflow-auto rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Profilim</h2>
            <p className="mt-1 text-sm text-slate-500">Satıcı bilgilerini güçlendir. Güven skoru ilan dönüşümünü doğrudan etkiler.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-slate-50 p-5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Profil yükleniyor...</div>
        ) : (
          <div className="space-y-4">
            <TrustScoreCard profile={previewProfile} user={user} />

            {profile?.is_suspended && (
              <div className="rounded-3xl bg-rose-50 p-4 text-sm font-bold text-rose-800 ring-1 ring-rose-100">
                Hesabın askıya alındı. Profil bilgilerini güncelleyebilirsin, ancak ilan verme ve mesajlaşma kapalıdır.
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><Mail size={15} /> Hesap e-postası</div>
              <div className="truncate text-sm font-bold text-slate-900">{user?.email || 'E-posta bulunamadı'}</div>
              <p className="mt-1 text-xs font-semibold text-slate-500">E-posta giriş hesabına bağlıdır; buradan değiştirilmez.</p>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><User size={16} /> Profil fotoğrafı URL</span>
              <input
                value={form.avatar_url}
                onChange={(event) => update('avatar_url', event.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><User size={16} /> Ad Soyad</span>
                <input
                  value={form.full_name}
                  onChange={(event) => update('full_name', event.target.value)}
                  placeholder="Ali Mutlu"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Store size={16} /> Mağaza adı</span>
                <input
                  value={form.store_name}
                  onChange={(event) => update('store_name', event.target.value)}
                  placeholder="Nouméa Auto / Ali Marine"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={16} /> Telefon / WhatsApp</span>
                <input
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  placeholder="+687 ..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={requestPhoneCheck}
                    disabled={verifyingPhone || phoneVerified}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:bg-slate-300"
                  >
                    {phoneVerified ? <BadgeCheck size={14} /> : <Phone size={14} />} {phoneVerified ? 'Telefon doğrulandı' : verifyingPhone ? 'İstek oluşturuluyor...' : 'Doğrulama iste'}
                  </button>
                  {!phoneVerified && phoneRequested && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-100"><Clock3 size={14} /> Onay bekliyor</span>
                  )}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><MapPin size={16} /> Konum</span>
                <input
                  value={form.location}
                  onChange={(event) => update('location', event.target.value)}
                  placeholder="Nouméa, Dumbéa, Païta..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><FileText size={16} /> Satıcı açıklaması</span>
              <textarea
                value={form.bio}
                onChange={(event) => update('bio', event.target.value)}
                placeholder="Kısaca kim olduğunu, ne sattığını ve alıcıların sana neden güvenebileceğini yaz."
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400"
              />
            </label>

            <div className="rounded-3xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
              <div className="flex items-center gap-2 font-black"><ShieldCheck size={17} /> Güven etkisi</div>
              <p className="mt-1 text-emerald-700">Dolgun profil + doğru telefon + konum, ilan dönüşümünü ciddi artırır. Boş satıcı profili marketplace’te güven kırar.</p>
            </div>

            {successText && (
              <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
                {successText}
              </div>
            )}

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
