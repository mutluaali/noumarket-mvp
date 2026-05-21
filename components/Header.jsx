import { Plus, Crown, Lock, LogOut, User, List, MessageCircle, Heart, Bell } from 'lucide-react';

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
  notificationCount = 0,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
            NC
          </div>
          <div>
            <div className="text-xl font-black tracking-tight">NouMarket</div>
            <div className="text-xs text-slate-500">New Caledonia Classifieds MVP</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onPricing} className="hidden items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm md:flex">
            <Crown size={17} /> Premium
          </button>

          {user && isAdmin && (
            <button onClick={onAdmin} className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm md:flex">
              <Lock size={15} /> Admin Paneli
            </button>
          )}

          {user && (
            <>
              <button onClick={onMyListings} className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm md:flex">
                <List size={15} /> İlanlarım
              </button>

              <button onClick={onMessages} className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm md:flex">
                <MessageCircle size={15} /> Mesajlarım
              </button>

              <button onClick={onFavorites} className="hidden items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm md:flex">
                <Heart size={15} /> Favorilerim
              </button>

              <button onClick={onNotifications} className="relative hidden items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm md:flex">
                <Bell size={15} /> Bildirimler
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-lg ring-2 ring-white">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            </>
          )}

          {user ? (
            <>
              <div className="hidden max-w-[220px] truncate items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 md:flex">
                <User size={15} /> {user.email}
              </div>

              <button onClick={onLogout} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
                <span className="inline-flex items-center gap-2">
                  <LogOut size={15} /> Çıkış Yap
                </span>
              </button>
            </>
          ) : (
            <button onClick={onAuth} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              Giriş Yap
            </button>
          )}

          <button onClick={onCreate} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800">
            <Plus size={17} /> İlan Ver
          </button>
        </div>
      </div>
    </header>
  );
}
