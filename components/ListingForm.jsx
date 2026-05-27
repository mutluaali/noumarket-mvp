'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronRight, ImagePlus, ShieldCheck, Sparkles, AlertCircle, Home, Car, ShoppingBag, UploadCloud, Phone, MessageCircle, Globe2 } from 'lucide-react';
import { CATEGORY_TREE, FIELD_DEFINITIONS, VEHICLE_MODELS } from '@/lib/categorySchema';
import { NEW_CALEDONIA_LOCATIONS, CITY_OPTIONS } from '@/lib/locations';


const initialForm = {
  title: '', description: '', price: '', city: 'Nouméa', district: 'Anse Vata', neighborhood: '',
  sellerName: '', sellerPhone: '', sellerEmail: '', image: '', images: [], contactMethods: ['message']
};

function formatNumberInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
}

function parseNumberInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

function scoreListing(form, path, attributes) {
  let score = 0;
  if (path.length >= 2) score += 20;
  if (form.title.length >= 12) score += 15;
  if (form.description.length >= 80) score += 20;
  if (form.price) score += 10;
  if (form.city && form.district) score += 8;
  if (form.images.length || form.image) score += 12;
  if (form.contactMethods.length) score += 8;
  if (Object.values(attributes).filter(Boolean).length >= 2) score += 7;
  return Math.min(score, 100);
}

function inferBrandFromPath(path) {
  const brandNode = path.find((node) =>
    /^(car|suv|ev|moto|commercial)-/.test(node?.id || '') && !String(node.id).endsWith('-other')
  );
  return brandNode?.label || '';
}

function FieldInput({ fieldKey, value, onChange, selectedNode }) {
  const config = FIELD_DEFINITIONS[fieldKey];
  if (!config) return null;
  const numberLike = ['mileage', 'engineHours', 'rangeKm', 'areaM2', 'deposit'].includes(fieldKey);
  const dynamicModelOptions = fieldKey === 'model' ? VEHICLE_MODELS[selectedNode?.id] : null;

  if (config.type === 'select' || dynamicModelOptions?.length) {
    const options = dynamicModelOptions || config.options || [];
    const hasOtherOption = options.includes('Diğer');
    const isCustomModel = fieldKey === 'model' && hasOtherOption && value && !options.includes(value);
    const selectValue = isCustomModel ? 'Diğer' : (value || '');
    const showCustomModelInput = fieldKey === 'model' && hasOtherOption && (selectValue === 'Diğer');

    return (
      <label className="block min-w-0">
        <span className="mb-1 block text-xs font-black text-slate-500">{config.label}</span>
        <select
          value={selectValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Seç</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        {showCustomModelInput ? (
          <input
            type="text"
            value={isCustomModel ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Model adını yaz"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
          />
        ) : null}
      </label>
    );
  }

  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-black text-slate-500">{config.label}</span>
      <input
        type="text"
        inputMode={numberLike || config.type === 'number' ? 'numeric' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(numberLike || config.type === 'number' ? formatNumberInput(e.target.value) : e.target.value)}
        placeholder={config.placeholder || ''}
        className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

function TopCategoryIcon({ id }) {
  if (id === 'real-estate') return <Home size={17} />;
  if (id === 'vehicles') return <Car size={17} />;
  return <ShoppingBag size={17} />;
}

function FilePreview({ image, onRemove }) {
  return (
    <div className="relative h-20 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <img src={image} alt="İlan görseli" className="h-full w-full object-cover" />
      <button type="button" onClick={onRemove} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-900 shadow"><X size={13}/></button>
    </div>
  );
}

export default function ListingForm({ onClose, onCreate, user, profile }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    sellerName: profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    sellerPhone: profile?.phone || profile?.phone_number || '',
    sellerEmail: profile?.email || user?.email || '',
  }));
  const [path, setPath] = useState([]);
  const [attributes, setAttributes] = useState({});
  const fileInputRef = useRef(null);

  const selectedNode = path[path.length - 1] || null;
  const fields = selectedNode?.fields || [];
  const visibleDistricts = NEW_CALEDONIA_LOCATIONS[form.city] || [];
  const categoryLabel = path.map((x) => x.label).join(' > ');
  const qualityScore = useMemo(() => scoreListing(form, path, attributes), [form, path, attributes]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  function selectNode(node, levelIndex) {
    const nextPath = [...path.slice(0, levelIndex), node];
    setPath(nextPath);
    setAttributes({});
  }

  function addFiles(files) {
    const next = Array.from(files || []).filter((file) => file.type.startsWith('image/')).slice(0, 12 - form.images.length);
    if (!next.length) return;
    const urls = next.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...urls], image: prev.image || urls[0] }));
  }

  function toggleContact(method) {
    setForm((prev) => {
      const exists = prev.contactMethods.includes(method);
      const next = exists ? prev.contactMethods.filter((item) => item !== method) : [...prev.contactMethods, method];
      return { ...prev, contactMethods: next.length ? next : ['message'] };
    });
  }

  function submit(e) {
    e.preventDefault();
    const location = [form.city, form.district, form.neighborhood].filter(Boolean).join(', ');
    if (!form.title || !form.price || !location || path.length < 2) {
      alert('Başlık, fiyat, konum ve kategori yolu zorunlu. Kategori en az 2 seviye seçilmeli.');
      return;
    }
    const categoryId = path[0]?.id || '';
    const subcategoryId = selectedNode?.id || '';
    const inferredBrand = inferBrandFromPath(path);
    const cleanedAttributes = Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [key, ['mileage','engineHours','rangeKm','areaM2','deposit'].includes(key) ? parseNumberInput(value) : value])
    );
    if (inferredBrand && !cleanedAttributes.brand) cleanedAttributes.brand = inferredBrand;
    const images = form.images.length ? form.images : (form.image ? [form.image] : []);
    onCreate({
      title: form.title,
      description: form.description,
      price: parseNumberInput(form.price),
      location,
      sellerName: form.sellerName,
      sellerPhone: form.sellerPhone,
      sellerEmail: form.sellerEmail,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      category: path[0]?.label || 'Diğer',
      subcategory: categoryLabel,
      category_label: categoryLabel,
      attributes: cleanedAttributes,
      contactMethods: form.contactMethods,
      trust_score: qualityScore,
      image_url: images[0] || '',
      images,
      status: 'pending',
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 p-0 backdrop-blur-sm sm:p-2 md:p-5">
      <div className="mx-auto flex h-[100dvh] max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[96dvh] sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black sm:text-xl">İlan Ver</h2>
            <p className="text-xs font-medium text-slate-500">Kategori akışı sadeleştirildi. Seçtikçe sadece ilgili alt seçenekler açılır.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 p-2 hover:bg-slate-200"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[340px_minmax(0,1fr)] lg:overflow-hidden">
          <aside className="min-w-0 border-b border-slate-200 bg-slate-50 p-3 lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r">
            <div className="mb-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black">Kategori yolu</h3>
                {path.length > 0 && <button type="button" onClick={() => { setPath([]); setAttributes({}); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Değiştir</button>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs font-bold text-slate-500">
                {path.length ? path.map((x, i) => <span key={x.id} className="inline-flex min-w-0 items-center gap-1"><span className="truncate">{x.label}</span>{i < path.length - 1 && <ChevronRight size={12} />}</span>) : 'Kategori seçilmedi'}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">{path[0] ? 'Seçilen ana kategori' : 'Ana kategori'}</div>
                <div className="grid gap-2">
                  {(path[0] ? [path[0]] : CATEGORY_TREE).map((node) => (
                    <button key={node.id} type="button" onClick={() => selectNode(node, 0)} className={`flex min-w-0 items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-black ring-1 ${path[0]?.id === node.id ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100"><TopCategoryIcon id={node.id} /></span>
                      <span className="min-w-0 flex-1 truncate">{node.label}</span>
                      <span className="shrink-0 text-[11px] font-bold text-slate-400">{Number(node.count || 0).toLocaleString('tr-TR')}</span>
                      {node.children?.length ? <ChevronRight className="shrink-0" size={14} /> : null}
                    </button>
                  ))}
                </div>
              </div>

              {path.slice(1).map((node, index) => (
                <div key={node.id}>
                  <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Seçilen {index + 2}. seviye</div>
                  <button type="button" onClick={() => selectNode(node, index + 1)} className="flex w-full min-w-0 items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2.5 text-left text-sm font-black text-blue-700 ring-1 ring-blue-200">
                    <span className="min-w-0 flex-1 truncate">{node.label}</span>
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">{Number(node.count || 0).toLocaleString('tr-TR')}</span>
                    {node.children?.length ? <ChevronRight className="shrink-0" size={14} /> : null}
                  </button>
                </div>
              ))}

              {selectedNode?.children?.length ? (
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">{path.length + 1}. seviye seçenekleri</div>
                  <div className="grid gap-2">
                    {selectedNode.children.map((child) => (
                      <button key={child.id} type="button" onClick={() => selectNode(child, path.length)} className="flex min-w-0 items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5 text-left text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200">
                        <span className="min-w-0 flex-1 truncate">{child.label}</span>
                        <span className="shrink-0 text-[11px] font-bold text-slate-400">{Number(child.count || 0).toLocaleString('tr-TR')}</span>
                        {child.children?.length ? <ChevronRight className="shrink-0" size={14} /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <main className="min-w-0 p-3 sm:p-4 md:p-6 lg:overflow-y-auto">
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-blue-50 p-4 text-blue-800 ring-1 ring-blue-100"><Sparkles size={18}/><div className="mt-2 text-2xl font-black">{qualityScore}%</div><div className="text-xs font-bold">İlan kalite skoru</div></div>
              <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-100"><ShieldCheck size={18}/><div className="mt-2 text-sm font-black">Onay sonrası yayında</div><div className="text-xs font-bold">Güvenli moderasyon</div></div>
              <div className="rounded-3xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-100"><AlertCircle size={18}/><div className="mt-2 text-sm font-black">Eksik bilgi dönüşümü düşürür</div><div className="text-xs font-bold">Fotoğraf + açıklama şart</div></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="mb-1 block text-xs font-black text-slate-500">Başlık</span><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Örn: Kiralık F2 daire" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label>
              <label><span className="mb-1 block text-xs font-black text-slate-500">Fiyat</span><input type="text" inputMode="numeric" value={form.price} onChange={(e)=>setForm({...form,price:formatNumberInput(e.target.value)})} placeholder="875.000" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label>
              <div className="grid gap-3 sm:grid-cols-3 md:col-span-1">
                <label><span className="mb-1 block text-xs font-black text-slate-500">Şehir</span><select value={form.city} onChange={(e)=>{ const nextCity = e.target.value; setForm({...form, city: nextCity, district: (NEW_CALEDONIA_LOCATIONS[nextCity] || [''])[0] || '', neighborhood: ''}); }} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500">{CITY_OPTIONS.map((city)=><option key={city}>{city}</option>)}</select></label>
                <label><span className="mb-1 block text-xs font-black text-slate-500">Semt</span><select value={form.district} onChange={(e)=>setForm({...form,district:e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500">{visibleDistricts.map((item)=><option key={item}>{item}</option>)}</select></label>
                <label><span className="mb-1 block text-xs font-black text-slate-500">Mahalle</span><input value={form.neighborhood} onChange={(e)=>setForm({...form,neighborhood:e.target.value})} placeholder="Opsiyonel" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500" /></label>
              </div>
              <label className="md:col-span-2"><span className="mb-1 block text-xs font-black text-slate-500">Açıklama</span><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} rows={5} placeholder="İlanı net anlat. Durum, kusur, teslimat, pazarlık bilgisi..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label>
            </div>

            {fields.length > 0 && <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4"><h3 className="mb-3 font-black">Kategoriye özel bilgiler</h3><div className="grid gap-4 md:grid-cols-2">{fields.map((fieldKey)=><FieldInput key={fieldKey} fieldKey={fieldKey} selectedNode={selectedNode} value={attributes[fieldKey]} onChange={(value)=>setAttributes({...attributes,[fieldKey]:value})}/>)}</div></div>}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="font-black">Fotoğraflar</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Çoklu fotoğraf seçebilirsin. Şimdilik önizleme lokal çalışır; production’da Supabase Storage’a bağlanmalı.</p>
              <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); addFiles(e.dataTransfer.files);}} className="mt-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="grid h-24 w-full place-items-center rounded-3xl bg-white text-slate-400 md:w-32"><UploadCloud size={34}/></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black">Fotoğrafları sürükle bırak veya seç</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.images.map((image, index)=><FilePreview key={image} image={image} onRemove={()=>setForm((prev)=>({...prev, images: prev.images.filter((_,i)=>i!==index), image: prev.images[index+1] || prev.images[0] || ''}))}/>) }
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={()=>fileInputRef.current?.click()} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Dosya seç</button>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>addFiles(e.target.files)} />
                      <input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="veya https:// görsel URL" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-black">Satıcı bilgileri</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Üyelik bilgileri kullanılacak</span></div>
              <div className="mt-3 flex items-center gap-3 rounded-3xl bg-slate-50 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white">{(form.sellerName || form.sellerEmail || 'N').slice(0,1).toUpperCase()}</div>
                <div className="min-w-0"><div className="truncate font-black">{form.sellerName || 'Satıcı'}</div><div className="truncate text-xs font-bold text-slate-500">{form.sellerEmail || 'E-posta yok'}</div></div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
              <h3 className="font-black">İletişim tercihleri</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <button type="button" onClick={()=>toggleContact('message')} className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${form.contactMethods.includes('message') ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-700 ring-slate-200'}`}><MessageCircle className="mr-2 inline" size={16}/>Site içi mesaj</button>
                <button type="button" onClick={()=>toggleContact('phone')} className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${form.contactMethods.includes('phone') ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-700 ring-slate-200'}`}><Phone className="mr-2 inline" size={16}/>Telefon</button>
                <button type="button" onClick={()=>toggleContact('whatsapp')} className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${form.contactMethods.includes('whatsapp') ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-700 ring-slate-200'}`}><Globe2 className="mr-2 inline" size={16}/>WhatsApp</button>
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white/95 py-4 backdrop-blur sm:flex sm:justify-end sm:gap-3"><button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black">Vazgeç</button><button type="submit" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:px-6">Onaya gönder</button></div>
          </main>
        </form>
      </div>
    </div>
  );
}
