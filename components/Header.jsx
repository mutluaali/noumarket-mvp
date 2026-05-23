'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Crown, Lock, LogOut, User, List, MessageCircle, Heart, Bell, Bookmark, Menu, X, ChevronDown, Search } from 'lucide-react';

function HeaderButton({ children, onClick, variant = 'ghost', className = '' }) {
  const styles = {
    ghost: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    dark: 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800',
    soft: 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm transition active:scale-[0.98] ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function MenuItem({ icon, children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      {icon}
      <span className="truncate">{children}</span>
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
  onSearchFocus,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  notificationCount = 0,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function run(action) {
    setMobileOpen(false);
    setAccountOpen(false);
    action?.();
  }

  const notificationBadge = notificationCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-sm ring-2 ring-white">
      {notificationCount > 99 ? '99+' : notificationCount}
    </span>
  );

  const accountMenu = user && (
    <div className="grid gap-1">
      <MenuItem icon={<User size={16} />} onClick={() => run(onProfile)}>{user.email}</MenuItem>
      <MenuItem icon={<List size={16} />} onClick={() => run(onMyListings)}>İlanlarım</MenuItem>
      <MenuItem icon={<MessageCircle size={16} />} onClick={() => run(onMessages)}>Mesajlarım</MenuItem>
      <MenuItem icon={<Heart size={16} />} onClick={() => run(onFavorites)}>Favorilerim</MenuItem>
      <MenuItem icon={<Bell size={16} />} onClick={() => run(onNotifications)}>Bildirimler {notificationCount > 0 ? `(${notificationCount})` : ''}</MenuItem>
      <MenuItem icon={<Bookmark size={16} />} onClick={() => run(onSavedSearches)}>Kayıtlı aramalar</MenuItem>
      {isAdmin && <MenuItem icon={<Lock size={16} />} onClick={() => run(onAdmin)}>Admin paneli</MenuItem>}
      <div className="my-1 h-px bg-slate-200" />
      <MenuItem icon={<LogOut size={16} />} onClick={() => run(onLogout)} danger>Çıkış yap</MenuItem>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => run(undefined)} className="flex min-w-0 items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-sm">NM</div>
          <div className="min-w-0">
            <div className="truncate text-lg font-black tracking-tight text-slate-950">NouMarket</div>
            <div className="hidden text-xs font-semibold text-slate-500 sm:block">New Caledonia marketplace</div>
          </div>
        </button>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(onSearchSubmit || onSearchFocus);
          }}
          className="ml-2 hidden min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition focus-within:bg-white focus-within:shadow-sm lg:flex"
        >
          <Search size={17} className="shrink-0 text-slate-500" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            onFocus={onSearchFocus}
            placeholder="İlan, kategori veya lokasyon ara..."
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
          />
          <button type="submit" className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800">Ara</button>
        </form>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <HeaderButton onClick={onPricing} variant="ghost"><Crown size={16} /> Premium</HeaderButton>

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="relative inline-flex max-w-[220px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <User size={16} />
                <span className="truncate">Hesabım</span>
                <ChevronDown size={15} />
                {notificationBadge}
              </button>

              {accountOpen && <div className="absolute right-0 mt-2 w-72 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">{accountMenu}</div>}
            </div>
          ) : (
            <HeaderButton onClick={onAuth} variant="ghost">Giriş yap</HeaderButton>
          )}

          <HeaderButton onClick={onCreate} variant="dark"><Plus size={17} /> İlan ver</HeaderButton>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <button type="button" onClick={() => run(onSearchFocus)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Arama"><Search size={18} /></button>
          <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-sm"><Plus size={17} /> İlan ver</button>
          <button type="button" onClick={() => setMobileOpen((value) => !value)} className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            {notificationBadge}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <HeaderButton onClick={() => run(onPricing)} variant="soft" className="w-full"><Crown size={17} /> Premium</HeaderButton>
            {user ? accountMenu : <HeaderButton onClick={() => run(onAuth)} variant="ghost" className="w-full">Giriş yap</HeaderButton>}
          </div>
        </div>
      )}
    </header>
  );
}
