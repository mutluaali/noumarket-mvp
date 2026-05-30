'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ChevronDown, ChevronRight, Grid2X2, Crown, Home } from 'lucide-react';
import { CATEGORY_TREE, findCategoryNode, formatCount } from '@/lib/categorySchema';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function CategoryNode({ node, level = 0, selectedCategoryId, openIds, onToggle, onSelect, categoryCounts = {}, countsReady = false }) {
  const isOpen = openIds.has(node.id);
  const isSelected = selectedCategoryId === node.id;
  const hasChildren = Boolean(node.children?.length);
  const isMain = level === 0;
  const displayCount = countsReady ? (categoryCounts[node.id] ?? 0) : 0;

  const levelStyle = level === 0
    ? 'px-3 py-2.5 text-sm font-black'
    : level === 1
      ? 'px-3 py-2 text-[13px] font-extrabold'
      : 'px-3 py-2 text-[13px] font-semibold';

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
            return;
          }
          onSelect(node);
        }}
        aria-expanded={hasChildren ? isOpen : undefined}
        className={`flex w-full items-center gap-3 rounded-2xl text-left transition ${levelStyle} ${
          isSelected
            ? 'bg-brand-soft text-brand-teal-dark ring-1 ring-brand-teal/15 dark:bg-brand-teal/10 dark:text-brand-teal-light dark:ring-brand-teal-light/20'
            : isMain
              ? 'text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/10'
              : 'text-slate-700 hover:bg-slate-50 hover:text-brand-teal dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-brand-teal-light'
        }`}
      >
        {isMain ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-slate-100 text-base dark:bg-white/10">{node.icon || '*'}</span>
        ) : (
          <span className="shrink-0" style={{ width: `${Math.max(0, level - 1) * 14}px` }} />
        )}

        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{formatCount(displayCount)}</span>
        {hasChildren ? (isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />) : null}
      </button>

      {hasChildren && isOpen ? (
        <div className={`${isMain ? 'mt-1 rounded-2xl bg-slate-50/70 p-2 dark:bg-white/5' : 'mt-0.5'} space-y-0.5`}>
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedCategoryId={selectedCategoryId}
              openIds={openIds}
              onToggle={onToggle}
              onSelect={onSelect}
              categoryCounts={categoryCounts}
              countsReady={countsReady}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function MarketplaceSidebar({ selectedCategoryId, onSelectCategory, categoryCounts = {}, onPremiumClick, onHomeClick, className = '' }) {
  const countsReady = useHydrated();
  const selected = selectedCategoryId ? findCategoryNode(selectedCategoryId) : null;
  const selectedPathIds = useMemo(() => selected?.path?.map((item) => item.id) || [], [selected]);
  const [openIds, setOpenIds] = useState(new Set());

  useEffect(() => {
    if (!selectedPathIds.length) return;
    setOpenIds((prev) => {
      const next = new Set(prev);
      selectedPathIds.slice(0, -1).forEach((id) => next.add(id));
      return next;
    });
  }, [selectedPathIds.join('|')]);

  function toggleNode(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetAll() {
    setOpenIds(new Set());
    onSelectCategory(null);
  }

  const shellClassName = className || 'hidden w-full self-start rounded-shell border border-[var(--field-border)] bg-[var(--surface-glass)] p-4 shadow-card backdrop-blur lg:sticky lg:top-[88px] lg:z-30 lg:block lg:min-h-[calc(100dvh-104px)]';

  return (
    <aside data-marketplace-sidebar="true" className={shellClassName}>
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 px-2 pb-3 dark:border-white/10">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Kategoriler</h2>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Ana kategoriye tıkla, alt seçenekleri aç.</p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-xl bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
        >
          Tüm kategoriler
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          onHomeClick?.();
          resetAll();
        }}
        className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-brand-soft px-3 py-2.5 text-left text-sm font-black text-brand-teal-dark ring-1 ring-brand-teal/15 dark:bg-brand-teal/10 dark:text-brand-teal-light dark:ring-brand-teal-light/20"
      >
        <Home size={18} /> Ana Sayfa
      </button>

      <button
        type="button"
        onClick={resetAll}
        className={`mb-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-black ${
          !selectedCategoryId ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/20' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
        }`}
      >
        <Grid2X2 size={16} /> Tüm ilanlar
      </button>

      <div className="space-y-1.5">
        {CATEGORY_TREE.map((node) => (
          <CategoryNode
            key={node.id}
            node={node}
            selectedCategoryId={selectedCategoryId}
            openIds={openIds}
            onToggle={toggleNode}
            onSelect={onSelectCategory}
            categoryCounts={categoryCounts}
            countsReady={countsReady}
          />
        ))}
      </div>

      <div className="mt-4 shrink-0 rounded-panel border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-4 text-sm shadow-sm dark:border-amber-300/20 dark:from-amber-400/10 dark:to-brand-charcoal/40">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
          <Crown size={20} />
        </div>
        <div className="mt-2 font-black text-slate-900 dark:text-white">Premium&apos;a Yüksel</div>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">Daha fazla görünürlük, öncelikli destek ve satıcı avantajları.</p>
        <button type="button" onClick={onPremiumClick} className="mt-3 w-full cursor-pointer rounded-2xl bg-brand-teal px-3 py-2.5 text-xs font-black text-white transition hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-brand-teal/30">Premium&apos;u Keşfet</button>
      </div>
    </aside>
  );
}
