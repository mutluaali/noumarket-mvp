'use client';

import { AlertTriangle, Inbox, LockKeyhole, RefreshCw } from 'lucide-react';

export function ModalShell({ eyebrow, title, subtitle, onClose, action, children }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/55 p-0 backdrop-blur-sm sm:p-3 md:p-8">
      <div className="mx-auto flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-24px)] sm:rounded-[28px] md:max-h-[calc(100dvh-64px)]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-4 sm:gap-4 sm:p-5 md:p-6">
          <div className="min-w-0">
            {eyebrow ? <div className="mb-2 text-sm font-black text-rose-600">{eyebrow}</div> : null}
            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" aria-label="Kapat">×</button>
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
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-4 grid gap-3">
        {Array.from({ length: lines }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-200/80" />)}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center sm:rounded-3xl sm:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm"><Icon size={24} /></div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p> : null}
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
