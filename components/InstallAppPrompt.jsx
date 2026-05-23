'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem('noumarket_install_prompt_dismissed') === '1') return;

    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    const fallbackTimer = setTimeout(() => {
      const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
      const isMobile = window.innerWidth < 768;
      if (!isStandalone && isMobile) setVisible(true);
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem('noumarket_install_prompt_dismissed', '1');
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) {
      alert('Chrome/Android kullanıyorsan tarayıcı menüsünden “Ana ekrana ekle” seçeneğini kullanabilirsin. iPhone’da Paylaş > Ana Ekrana Ekle.');
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[55] mx-auto max-w-md rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-2xl lg:bottom-6 lg:left-auto lg:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Smartphone size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-slate-950">NouMarket’i uygulama gibi kullan</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Hızlı erişim için ana ekrana ekle. Marketplace mobilden daha güçlü çalışmalı.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={install} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">
              <Download size={15} /> Ekle
            </button>
            <button onClick={dismiss} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600">Sonra</button>
          </div>
        </div>
        <button onClick={dismiss} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
