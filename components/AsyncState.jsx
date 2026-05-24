'use client';

import { AlertTriangle, Inbox, LockKeyhole, RefreshCw } from 'lucide-react';

export function ModalShell({ eyebrow, title, subtitle, onClose, action, children }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/55 p-3 backdrop-blur-sm md:p-8">
      <div className="mx-auto max-h-[calc(100vh-24px)] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl md:max-h-[calc(100vh-64px)] md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <div className="mb-2 text-sm font-black text-rose-600">{eyebrow}</div> : null}
            <h2 className="text-2xl font-black text-slate-950">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" aria-label="Kapat">×</button>
          </div>
        </div>
        {children}
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
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm"><Icon size={24} /></div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
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
