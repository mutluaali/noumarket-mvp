'use client';

import { useState } from 'react';
import { Plus, Crown, Lock, LogOut, User, List, MessageCircle, Heart, Bell, Bookmark, Menu, X } from 'lucide-react';

function NavButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm ${className}`}>
      {children}
    </button>
  );
}

export default function Header({
  user,
  isAdmin,
  onAuth,
  onLogout,
  onCreate,
  onPricing,
  onAdmin,
  onMyListings,
  onMessages,
  onFavorites,
  onNotifications,
  onSavedSearches,
  onProfile,
  notificationCount = 0,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function run(action) {
    setMobileOpen(false);
    action?.();
  }

  const notificationBadge = notificationCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-lg ring-2 ring-white">
      {notificationCount > 99 ? '99+' : notificationCount}
    </span>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <button onClick={() => run(undefined)} className="flex items-center gap-3 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
            NC
          </div>
          <div>
            <div className="text-xl font-black tracking-tight">NouMarket</div>
            <div className="text-xs text-slate-500">New Caledonia Classifieds</div>
          </div>
        </button>

        <div className="hidden items-center gap-2 lg:flex">
          <NavButton onClick={onPricing} className="border-amber-200 bg-amber-50 text-amber-900">
            <Crown size={17} /> Premium
          </NavButton>

          {user && isAdmin && (
            <NavButton onClick={onAdmin}><Lock size={15} /> Admin Paneli</NavButton>
          )}

          {user && (
            <>
              <NavButton onClick={onMyListings}><List size={15} /> İlanlarım</NavButton>
              <NavButton onClick={onMessages}><MessageCircle size={15} /> Mesajlarım</NavButton>
              <NavButton onClick={onFavorites} className="border-rose-200 bg-rose-50 text-rose-700"><Heart size={15} /> Favorilerim</NavButton>
              <button onClick={onNotifications} className="relative flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm">
                <Bell size={15} /> Bildirimler {notificationBadge}
              </button>
              <button onClick={onSavedSearches} className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
                <Bookmark size={15} /> Aramalarım
              </button>
            </>
          )}

          {user ? (
            <>
              <button onClick={onProfile} className="max-w-[220px] truncate rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                <span className="inline-flex items-center gap-2"><User size={15} /> {user.email}</span>
              </button>
              <NavButton onClick={onLogout}><LogOut size={15} /> Çıkış Yap</NavButton>
            </>
          ) : (
            <NavButton onClick={onAuth}>Giriş Yap</NavButton>
          )}

          <button onClick={onCreate} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800">
            <Plus size={17} /> İlan Ver
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={onCreate} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm">
            <Plus size={17} /> İlan Ver
          </button>
          <button onClick={() => setMobileOpen((value) => !value)} className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            {notificationBadge}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <NavButton onClick={() => run(onPricing)} className="justify-center border-amber-200 bg-amber-50 text-amber-900"><Crown size={17} /> Premium</NavButton>
            {user && isAdmin && <NavButton onClick={() => run(onAdmin)} className="justify-center"><Lock size={15} /> Admin Paneli</NavButton>}
            {user && <NavButton onClick={() => run(onMyListings)} className="justify-center"><List size={15} /> İlanlarım</NavButton>}
            {user && <NavButton onClick={() => run(onMessages)} className="justify-center"><MessageCircle size={15} /> Mesajlarım</NavButton>}
            {user && <NavButton onClick={() => run(onFavorites)} className="justify-center border-rose-200 bg-rose-50 text-rose-700"><Heart size={15} /> Favorilerim</NavButton>}
            {user && <NavButton onClick={() => run(onNotifications)} className="relative justify-center border-sky-200 bg-sky-50 text-sky-700"><Bell size={15} /> Bildirimler {notificationBadge}</NavButton>}
            {user && <NavButton onClick={() => run(onSavedSearches)} className="justify-center border-indigo-200 bg-indigo-50 text-indigo-700"><Bookmark size={15} /> Aramalarım</NavButton>}
            {user ? (
              <>
                <button onClick={() => run(onProfile)} className="truncate rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">{user.email}</button>
                <NavButton onClick={() => run(onLogout)} className="justify-center"><LogOut size={15} /> Çıkış Yap</NavButton>
              </>
            ) : (
              <NavButton onClick={() => run(onAuth)} className="justify-center">Giriş Yap</NavButton>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
