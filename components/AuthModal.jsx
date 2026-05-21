'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase, hasSupabase } from '@/lib/supabase';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function closeAndRefresh() {
    onClose?.();

    // Session bilgisinin tüm componentlere yayılması için refresh
    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!hasSupabase) {
      setLoading(false);
      setMessage('Local .env.local eksik. Supabase URL ve ANON KEY girilmeli.');
      return;
    }

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setLoading(false);
        setMessage(error.message);
        return;
      }

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      setLoading(false);

      if (loginError) {
        setMessage('Kayıt oluşturuldu. Şimdi aynı bilgilerle giriş yap.');
        setMode('login');
        return;
      }

      setMessage('Kayıt ve giriş başarılı.');

      setTimeout(() => {
        closeAndRefresh();
      }, 500);

      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Giriş başarılı.');

    setTimeout(() => {
      closeAndRefresh();
    }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              NouMarket hesabınla devam et.
            </p>
          </div>

          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="space-y-3">
          {mode === 'register' && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ad Soyad"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
          )}

          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />
        </div>

        {message && (
          <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        <button
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white disabled:opacity-60"
        >
          {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMessage('');
            setMode(mode === 'login' ? 'register' : 'login');
          }}
          className="mt-4 w-full text-sm font-semibold text-slate-600"
        >
          {mode === 'login'
            ? 'Hesabın yok mu? Kayıt ol'
            : 'Zaten hesabın var mı? Giriş yap'}
        </button>
      </form>
    </div>
  );
}
