'use client';

import { useMemo, useState } from 'react';
import { X, ChevronRight, ImagePlus, ShieldCheck, Sparkles, AlertCircle, Home, Car, ShoppingBag } from 'lucide-react';
import { CATEGORY_TREE, FIELD_DEFINITIONS, buildCategoryLabel, findCategoryNode } from '@/lib/categorySchema';

const initialForm = { title: '', description: '', price: '', location: '', sellerName: '', sellerPhone: '', sellerEmail: '', image: '' };

function getLevelOptions(path) {
  if (!path.length) return CATEGORY_TREE;
  return path[path.length - 1]?.children || [];
}

function scoreListing(form, path, attributes) {
  let score = 0;
  if (path.length >= 2) score += 20;
  if (form.title.length >= 12) score += 15;
  if (form.description.length >= 80) score += 20;
  if (form.price) score += 10;
  if (form.location) score += 8;
  if (form.image) score += 12;
  if (form.sellerPhone) score += 8;
  if (Object.values(attributes).filter(Boolean).length >= 2) score += 7;
  return Math.min(score, 100);
}

function FieldInput({ fieldKey, value, onChange }) {
  const config = FIELD_DEFINITIONS[fieldKey];
  if (!config) return null;
  if (config.type === 'select') {
    return (
      <label className="block">
        <span className="mb-1 block text-xs font-black text-slate-500">{config.label}</span>
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500">
          <option value="">Seç</option>
          {config.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-500">{config.label}</span>
      <input type={config.type || 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={config.placeholder || ''} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500" />
    </label>
  );
}

function TopCategoryIcon({ id }) {
  if (id === 'real-estate') return <Home size={18} />;
  if (id === 'vehicles') return <Car size={18} />;
  return <ShoppingBag size={18} />;
}

export default function ListingForm({ onClose, onCreate }) {
  const [form, setForm] = useState(initialForm);
  const [path, setPath] = useState([]);
  const [attributes, setAttributes] = useState({});

  const selectedNode = path[path.length - 1] || null;
  const nextOptions = getLevelOptions(path);
  const fields = selectedNode?.fields || [];
  const categoryLabel = path.map((x) => x.label).join(' > ');
  const qualityScore = useMemo(() => scoreListing(form, path, attributes), [form, path, attributes]);

  function selectNode(node, levelIndex) {
    const nextPath = [...path.slice(0, levelIndex), node];
    setPath(nextPath);
    setAttributes({});
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title || !form.price || !form.location || path.length < 2) {
      alert('Başlık, fiyat, konum ve kategori yolu zorunlu. Kategori en az 2 seviye seçilmeli.');
      return;
    }
    const categoryId = path[0]?.id || '';
    const subcategoryId = selectedNode?.id || '';
    onCreate({
      ...form,
      price: Number(form.price),
      category_id: categoryId,
      subcategory_id: subcategoryId,
      category: path[0]?.label || 'Diğer',
      category_label: categoryLabel,
      attributes,
      trust_score: qualityScore,
      image_url: form.image,
      status: 'pending',
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto flex max-h-[94vh] max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-black">İlan Ver</h2>
            <p className="text-xs font-medium text-slate-500">Ana sayfa ile aynı sade ve güven veren tasarım dili.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 p-2 hover:bg-slate-200"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="grid flex-1 overflow-y-auto lg:grid-cols-[380px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <h3 className="font-black">Kategori yolu</h3>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs font-bold text-slate-500">
                {path.length ? path.map((x, i) => <span key={x.id} className="inline-flex items-center gap-1">{i > 0 && <ChevronRight size={12} />}{x.label}</span>) : 'Kategori seçilmedi'}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Ana kategori</div>
                <div className="grid gap-2">
                  {CATEGORY_TREE.slice(0, 4).map((node) => (
                    <button key={node.id} type="button" onClick={() => selectNode(node, 0)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black ring-1 ${path[0]?.id === node.id ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>
                      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100"><TopCategoryIcon id={node.id} /></span>{node.label}
                    </button>
                  ))}
                </div>
              </div>

              {path.map((node, index) => node.children?.length ? (
                <div key={node.id}>
                  <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">{index + 2}. seviye</div>
                  <div className="grid gap-2">
                    {node.children.map((child) => (
                      <button key={child.id} type="button" onClick={() => selectNode(child, index + 1)} className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-bold ring-1 ${path[index + 1]?.id === child.id ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>
                        <span>{child.label}</span>{child.children?.length ? <ChevronRight size={14} /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null)}
            </div>
          </aside>

          <main className="p-4 md:p-6">
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-blue-50 p-4 text-blue-800 ring-1 ring-blue-100"><Sparkles size={18}/><div className="mt-2 text-2xl font-black">{qualityScore}%</div><div className="text-xs font-bold">İlan kalite skoru</div></div>
              <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-100"><ShieldCheck size={18}/><div className="mt-2 text-sm font-black">Onay sonrası yayında</div><div className="text-xs font-bold">Güvenli moderasyon</div></div>
              <div className="rounded-3xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-100"><AlertCircle size={18}/><div className="mt-2 text-sm font-black">Eksik bilgi dönüşümü düşürür</div><div className="text-xs font-bold">Fotoğraf + açıklama şart</div></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="mb-1 block text-xs font-black text-slate-500">Başlık</span><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Örn: Kiralık 3+1 müstakil ev" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label>
              <label><span className="mb-1 block text-xs font-black text-slate-500">Fiyat</span><input type="number" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} placeholder="8750000" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label>
              <label><span className="mb-1 block text-xs font-black text-slate-500">Konum</span><input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} placeholder="Nouméa, İstanbul, Ankara..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs font-black text-slate-500">Açıklama</span><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} rows={5} placeholder="İlanı net anlat. Durum, kusur, teslimat, pazarlık bilgisi..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs font-black text-slate-500">Kapak fotoğraf URL</span><div className="flex gap-2"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100"><ImagePlus size={20}/></span><input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="https://..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></div></label>
            </div>

            {fields.length > 0 && <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4"><h3 className="mb-3 font-black">Kategoriye özel bilgiler</h3><div className="grid gap-4 md:grid-cols-2">{fields.map((fieldKey)=><FieldInput key={fieldKey} fieldKey={fieldKey} value={attributes[fieldKey]} onChange={(value)=>setAttributes({...attributes,[fieldKey]:value})}/>)}</div></div>}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4"><h3 className="mb-3 font-black">Satıcı bilgileri</h3><div className="grid gap-4 md:grid-cols-3"><input value={form.sellerName} onChange={(e)=>setForm({...form,sellerName:e.target.value})} placeholder="Ad Soyad" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"/><input value={form.sellerPhone} onChange={(e)=>setForm({...form,sellerPhone:e.target.value})} placeholder="Telefon" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"/><input value={form.sellerEmail} onChange={(e)=>setForm({...form,sellerEmail:e.target.value})} placeholder="E-posta" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"/></div></div>

            <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur"><button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black">Vazgeç</button><button type="submit" className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Onaya gönder</button></div>
          </main>
        </form>
      </div>
    </div>
  );
}
