'use client';

import { useState } from 'react';
import { Bell, Bookmark, ChevronDown, Crown, Heart, List, Lock, LogOut, Mail, Plus, Search, ShieldCheck, User } from 'lucide-react';

function HeaderAction({ children, onClick, badge, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="relative inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-950"
    >
      {children}
      {badge ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">{badge}</span> : null}
    </button>
  );
}

function MenuItem({ icon, children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold transition ${danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'}`}
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
  notificationCount = 0,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const notificationBadge = notificationCount > 9 ? '9+' : notificationCount || null;

  function submitSearch(event) {
    event.preventDefault();
    onSearchSubmit?.();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4">
        <a href="/" className="flex shrink-0 items-center gap-2" aria-label="NouMarket ana sayfa">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 to-cyan-800 text-lg font-black text-white shadow-sm">N</span>
          <span className="leading-none">
            <span className="block text-xl font-black tracking-[-0.04em] text-slate-950">NouMarket</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700/70">classifieds</span>
          </span>
        </a>

        <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 items-center lg:flex">
          <div className="flex h-11 w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition focus-within:border-cyan-700 focus-within:ring-4 focus-within:ring-cyan-700/10">
            <div className="flex w-44 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700">Tüm ilanlarda ara</div>
            <input
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Araç, ev, telefon, tekne, hizmet..."
              className="min-w-0 flex-1 border-0 px-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button type="submit" className="inline-flex w-14 items-center justify-center bg-cyan-700 text-white transition hover:bg-cyan-800" aria-label="Ara">
              <Search size={19} />
            </button>
          </div>
        </form>

        <nav className="ml-auto flex shrink-0 items-center gap-2">
          <HeaderAction onClick={onSavedSearches} title="Kayıtlı aramalar"><Bookmark size={18} /></HeaderAction>
          <HeaderAction onClick={onMessages} title="Mesajlar"><Mail size={18} /></HeaderAction>
          <HeaderAction onClick={onNotifications} title="Bildirimler" badge={notificationBadge}><Bell size={18} /></HeaderAction>
          <HeaderAction onClick={onFavorites} title="Favoriler"><Heart size={18} /></HeaderAction>
          <button
            type="button"
            onClick={onPricing}
            className="hidden h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-black text-amber-800 transition hover:bg-amber-100 xl:inline-flex"
          >
            <Crown size={16} /> Premium
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-cyan-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-cyan-800"
          >
            <Plus size={18} /> İlan Ver
          </button>

          <div className="relative">
            {user ? (
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                <User size={18} /> Hesabım <ChevronDown size={15} className={accountOpen ? 'rotate-180 transition' : 'transition'} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onAuth}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                <Lock size={17} /> Giriş
              </button>
            )}

            {accountOpen && user && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-3 pb-2">
                  <div className="truncate text-sm font-black text-slate-950">{user.email || 'Kullanıcı'}</div>
                  <div className="text-xs font-semibold text-slate-400">NouMarket hesabı</div>
                </div>
                <MenuItem icon={<User size={17} />} onClick={() => { setAccountOpen(false); onProfile?.(); }}>Profilim</MenuItem>
                <MenuItem icon={<List size={17} />} onClick={() => { setAccountOpen(false); onMyListings?.(); }}>İlanlarım</MenuItem>
                <MenuItem icon={<Mail size={17} />} onClick={() => { setAccountOpen(false); onMessages?.(); }}>Mesajlar</MenuItem>
                <MenuItem icon={<Heart size={17} />} onClick={() => { setAccountOpen(false); onFavorites?.(); }}>Favoriler</MenuItem>
                <MenuItem icon={<Bookmark size={17} />} onClick={() => { setAccountOpen(false); onSavedSearches?.(); }}>Kayıtlı aramalar</MenuItem>
                {isAdmin && <MenuItem icon={<ShieldCheck size={17} />} onClick={() => { setAccountOpen(false); onAdmin?.(); }}>Admin panel</MenuItem>}
                <div className="mt-1 border-t border-slate-100 pt-1">
                  <MenuItem icon={<LogOut size={17} />} danger onClick={() => { setAccountOpen(false); onLogout?.(); }}>Çıkış yap</MenuItem>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
