'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase, hasSupabase, getStableSession } from '@/lib/supabase';

export default function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

  async function closeAndRefresh() {
    const session = await getStableSession();
    await onAuthenticated?.(session?.user || null);
    onClose?.();
  }

  async function withAuthTimeout(promise, ms = 12000) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Giriş zaman aşımına uğradı. İnternet bağlantını kontrol edip tekrar dene.')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
      const { error } = await withAuthTimeout(supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      }));

      if (error) {
        setLoading(false);
        setMessage(error.message);
        return;
      }

      const { error: loginError } =
        await withAuthTimeout(supabase.auth.signInWithPassword({
          email,
          password,
        }));

      setLoading(false);

      if (loginError) {
        setMessage('Kayıt oluşturuldu. Şimdi aynı bilgilerle giriş yap.');
        setMode('login');
        return;
      }

      setMessage('Kayıt ve giriş başarılı.');
      await closeAndRefresh();
      return;
    }

    try {
      const { error } = await withAuthTimeout(supabase.auth.signInWithPassword({
        email,
        password,
      }));

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage('Giriş başarılı.');
      await closeAndRefresh();
    } catch (error) {
      setMessage(error.message || 'Giriş sırasında beklenmeyen bir hata oluştu.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => onClose?.()}>
      <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              {mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              NouMarket hesabınla devam et.
            </p>
          </div>

          <button type="button" onClick={() => onClose?.()} className="rounded-full p-2 hover:bg-slate-100">
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
          {loading ? 'İşleniyor...' : mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
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
            ? 'Hesabın yok mu? Hesap oluştur'
            : 'Zaten hesabın var mı? Giriş yap'}
        </button>
      </form>
    </div>
  );
}
