'use client';

export default function LanguageSwitcher({ locale = 'fr', onChange }) {
  return (
    <select
      value={locale}
      onChange={(event) => onChange?.(event.target.value)}
      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm"
    >
      <option value="fr">FR</option>
      <option value="en">EN</option>
      <option value="tr">TR</option>
    </select>
  );
}
