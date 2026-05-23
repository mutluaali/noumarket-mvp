'use client';

import { Home, Search, PlusCircle, MessageCircle, UserRound, Bug } from 'lucide-react';

export default function BottomNav({ onCreate, onMessages, onProfile, onSearchFocus, onFeedback, user, notificationCount = 0 }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-6 items-end gap-1 text-[11px] font-black text-slate-500">
        <a href="#top" className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 active:bg-slate-100">
          <Home size={21} /> Ana sayfa
        </a>
        <button onClick={onSearchFocus} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 active:bg-slate-100">
          <Search size={21} /> Ara
        </button>
        <button onClick={onCreate} className="-mt-8 flex flex-col items-center gap-1 text-slate-950">
          <span className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-slate-950 text-white shadow-2xl ring-4 ring-white active:scale-95">
            <PlusCircle size={30} />
          </span>
          İlan ver
        </button>
        <button onClick={onMessages} className="relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 active:bg-slate-100">
          <MessageCircle size={21} /> Mesaj
          {notificationCount > 0 && <span className="absolute right-4 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
        </button>
        <button onClick={onFeedback} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 active:bg-slate-100">
          <Bug size={21} /> Beta
        </button>
        <button onClick={onProfile} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 active:bg-slate-100">
          <UserRound size={21} /> {user ? 'Profil' : 'Giriş'}
        </button>
      </div>
    </nav>
  );
}
