import { SearchX, Plus } from 'lucide-react';

export default function EmptyState({ onClear, onCreate }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
        <SearchX size={26} />
      </div>
      <h3 className="mt-4 text-xl font-black">Bu filtreyle ilan bulunamadı</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Fiyat aralığını, konumu veya kategori seçimini gevşet. Küçük pazarda fazla dar filtre satışları öldürür.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button onClick={onClear} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm">
          Filtreleri temizle
        </button>
        <button onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white">
          <Plus size={17} /> İlk ilanı ver
        </button>
      </div>
    </div>
  );
}
