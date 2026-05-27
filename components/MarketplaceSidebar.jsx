'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Grid2X2 } from 'lucide-react';
import { CATEGORY_TREE, findCategoryNode, formatCount } from '@/lib/categorySchema';

function CategoryNode({ node, level = 0, selectedCategoryId, openIds, onToggle, onSelect, categoryCounts = {} }) {
  const isOpen = openIds.has(node.id);
  const isSelected = selectedCategoryId === node.id;
  const hasChildren = Boolean(node.children?.length);
  const isMain = level === 0;
  const displayCount = categoryCounts[node.id] ?? 0;

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
          onSelect(node);
          if (hasChildren) onToggle(node.id);
        }}
        className={`flex w-full items-center gap-3 rounded-2xl text-left transition ${levelStyle} ${
          isSelected
            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
            : isMain
              ? 'text-slate-900 hover:bg-slate-50'
              : 'text-slate-700 hover:bg-slate-50 hover:text-blue-700'
        }`}
      >
        {isMain ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-slate-100 text-base">{node.icon || '•'}</span>
        ) : (
          <span className="shrink-0" style={{ width: `${Math.max(0, level - 1) * 14}px` }} />
        )}

        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400">{formatCount(displayCount)}</span>
        {hasChildren ? (isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />) : null}
      </button>

      {hasChildren && isOpen ? (
        <div className={`${isMain ? 'mt-1 rounded-2xl bg-slate-50/70 p-2' : 'mt-0.5'} space-y-0.5`}>
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
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function MarketplaceSidebar({ selectedCategoryId, onSelectCategory, categoryCounts = {} }) {
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

  return (
    <aside className="sticky top-[76px] hidden h-[calc(100vh-92px)] w-[300px] shrink-0 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 px-2 pb-3">
        <div>
          <h2 className="text-sm font-black text-slate-900">Kategoriler</h2>
          <p className="text-[11px] font-medium text-slate-400">Ana kategoriye tıkla, alt seçenekleri aç.</p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-xl bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600 hover:bg-slate-200"
        >
          Tümü
        </button>
      </div>

      <button
        type="button"
        onClick={resetAll}
        className={`mb-2 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-black ${
          !selectedCategoryId ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
      >
        <Grid2X2 size={16} /> Tüm İlanlar
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
          />
        ))}
      </div>
    </aside>
  );
}
