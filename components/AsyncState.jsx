'use client';

import { useEffect } from 'react';
import { AlertTriangle, Inbox, LockKeyhole, RefreshCw } from 'lucide-react';

export function ModalShell({ eyebrow, title, subtitle, onClose, action, children }) {
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/55 p-0 backdrop-blur-sm sm:p-3 md:p-8" onClick={() => onClose?.()}>
      <div onClick={(event) => event.stopPropagation()} className="mx-auto flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[calc(100dvh-24px)] sm:rounded-[28px] md:max-h-[calc(100dvh-64px)]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 p-4 sm:gap-4 sm:p-5 md:p-6">
          <div className="min-w-0">
            {eyebrow ? <div className="mb-2 text-sm font-black text-rose-600">{eyebrow}</div> : null}
            <h2 className="text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            <button onClick={() => onClose?.()} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/15" aria-label="Kapat">×</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SkeletonBox({ lines = 3 }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 p-5">
      <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
      <div className="mt-4 grid gap-3">
        {Array.from({ length: lines }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-white/10" />)}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5 p-6 text-center sm:rounded-3xl sm:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300"><Icon size={24} /></div>
      <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:rounded-3xl sm:p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-amber-600"><AlertTriangle size={22} /></div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-amber-950">Veri yüklenemedi</h3>
          <p className="mt-1 text-sm leading-6 text-amber-800">{message}</p>
          {onRetry ? <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2 text-sm font-black text-white"><RefreshCw size={16}/> Yenile</button> : null}
        </div>
      </div>
    </div>
  );
}

export function LoginRequired({ title = 'Giriş yapman gerekiyor', text = 'Bu bölümü kullanmak için hesabına giriş yapmalısın.' }) {
  return <EmptyState icon={LockKeyhole} title={title} text={text} />;
}
