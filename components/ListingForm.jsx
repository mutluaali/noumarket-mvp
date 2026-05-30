'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronRight, ImagePlus, ShieldCheck, Sparkles, AlertCircle, Home, Car, ShoppingBag, UploadCloud, Phone, MessageCircle, Globe2 } from 'lucide-react';
import { CATEGORY_TREE, FIELD_DEFINITIONS, VEHICLE_MODELS } from '@/lib/categorySchema';
import { NEW_CALEDONIA_LOCATIONS, CITY_OPTIONS } from '@/lib/locations';
import { ACCOUNT_PLANS, LISTING_RIGHTS_CONFIG, formatXpfAmount, normalizeAccountEntitlements } from '@/lib/accountPlans';
import { validateListingImageFile, validateListingImages, MAX_LISTING_IMAGE_SIZE_MB } from '@/lib/uploadGuards';


const initialForm = {
  title: '', description: '', price: '', city: 'Noumea', district: 'Anse Vata', neighborhood: '',
  sellerName: '', sellerPhone: '', sellerEmail: '', image: '', contactMethods: ['message']
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

const labelClass = 'mb-1 block text-xs font-black text-slate-500 dark:text-slate-400';
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400';

function RequiredLabel({ children }) {
  return (
    <span className={labelClass}>
      {children} <span className="text-rose-500" aria-hidden="true">*</span>
    </span>
  );
}

function scoreListing(form, path, attributes) {
  let score = 0;
  if (path.length >= 2) score += 20;
  if (form.title.length >= 12) score += 15;
  if (form.description.length >= 80) score += 20;
  if (form.price) score += 10;
  if (form.city && form.district) score += 8;
  if (form.photos?.length || form.image) score += 12;
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
        <span className={labelClass}>{config.label}</span>
        <select
          value={selectValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
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
            className={`${inputClass} mt-2`}
          />
        ) : null}
      </label>
    );
  }

  return (
    <label className="block min-w-0">
      <span className={labelClass}>{config.label}</span>
      <input
        type="text"
        inputMode={numberLike || config.type === 'number' ? 'numeric' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(numberLike || config.type === 'number' ? formatNumberInput(e.target.value) : e.target.value)}
        placeholder={config.placeholder || ''}
        className={inputClass}
      />
    </label>
  );
}

function TopCategoryIcon({ id }) {
  if (id === 'real-estate') return <Home size={17} />;
  if (id === 'vehicles') return <Car size={17} />;
  return <ShoppingBag size={17} />;
}

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function makePhoto(file) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    file,
    previewUrl: URL.createObjectURL(file),
    uploadedUrl: '',
    name: file.name,
    size: file.size,
    type: file.type,
    duplicateKey: fileKey(file),
  };
}

function formatFileSize(size) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function PhotoCard({ photo, isCover, autoCover, onRemove, onMakeCover }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white p-2 shadow-sm dark:bg-slate-950/60 ${isCover ? 'border-cyan-400 ring-2 ring-cyan-300/50' : 'border-slate-200 dark:border-white/10'}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">
        <img src={photo.previewUrl || photo.uploadedUrl} alt={photo.name || 'İlan görseli'} className="h-full w-full object-cover" />
        {isCover ? <span className="absolute left-2 top-2 rounded-full bg-cyan-600 px-2 py-1 text-[10px] font-black text-white">{autoCover ? 'Otomatik kapak' : 'Kapak Fotoğrafı'}</span> : null}
        <button type="button" onClick={onRemove} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-900 shadow dark:bg-slate-950/80 dark:text-white" aria-label="Fotoğrafı sil"><X size={14}/></button>
      </div>
      <div className="mt-2 min-w-0">
        <div className="truncate text-xs font-black text-slate-700 dark:text-slate-200">{photo.name}</div>
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{formatFileSize(photo.size)}</div>
      </div>
      <button
        type="button"
        onClick={onMakeCover}
        disabled={isCover}
        className={`mt-2 w-full rounded-xl px-3 py-2 text-xs font-black ${isCover ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15'}`}
      >
        {isCover ? 'Kapak seçili' : 'Kapak yap'}
      </button>
    </div>
  );
}

export default function ListingForm({ onClose, onCreate, user, profile, listingEntitlements, onOpenPricing }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    sellerName: profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    sellerPhone: profile?.phone || profile?.phone_number || '',
    sellerEmail: profile?.email || user?.email || '',
  }));
  const [path, setPath] = useState([]);
  const [attributes, setAttributes] = useState({});
  const [photos, setPhotos] = useState([]);
  const [coverPhotoId, setCoverPhotoId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const photosRef = useRef([]);

  const selectedNode = path[path.length - 1] || null;
  const entitlements = listingEntitlements || normalizeAccountEntitlements(profile || {});
  const maxPhotos = Number(entitlements.listingPhotoLimit || LISTING_RIGHTS_CONFIG.freePhotoLimit);
  const isPremiumSeller = entitlements.accountPlan === ACCOUNT_PLANS.PREMIUM_SELLER;
  const requiresPayment = Boolean(entitlements.requiresStandardListingPayment);
  const fields = selectedNode?.fields || [];
  const visibleDistricts = NEW_CALEDONIA_LOCATIONS[form.city] || [];
  const categoryLabel = path.map((x) => x.label).join(' > ');
  const formForScore = useMemo(() => ({ ...form, photos }), [form, photos]);
  const qualityScore = useMemo(() => scoreListing(formForScore, path, attributes), [formForScore, path, attributes]);
  const activeCoverPhotoId = coverPhotoId || photos[0]?.id || null;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [onClose]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => () => {
    photosRef.current.forEach((photo) => {
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    });
  }, []);

  function selectNode(node, levelIndex) {
    const nextPath = [...path.slice(0, levelIndex), node];
    setPath(nextPath);
    setAttributes({});
  }

  function addFiles(files) {
    setUploadError('');
    const incoming = Array.from(files || []);
    if (!incoming.length) return;

    setPhotos((current) => {
      const existingKeys = new Set(current.map((photo) => photo.duplicateKey));
      const accepted = [];
      let duplicateCount = 0;
      let validationError = '';
      const availableSlots = Math.max(0, maxPhotos - current.length);

      for (const file of incoming) {
        const fileValidation = validateListingImageFile(file);
        if (!fileValidation.ok) {
          validationError = fileValidation.error;
          continue;
        }

        const key = fileKey(file);
        if (existingKeys.has(key)) {
          duplicateCount += 1;
          continue;
        }
        if (accepted.length >= availableSlots) break;
        existingKeys.add(key);
        accepted.push(makePhoto(file));
      }

      if (validationError) setUploadError(validationError);
      else if (duplicateCount > 0) setUploadError(`${duplicateCount} fotoğraf zaten ekli olduğu için tekrar eklenmedi.`);
      if (!accepted.length) return current;
      return [...current, ...accepted];
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePhoto(id) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      const next = current.filter((photo) => photo.id !== id);
      if (coverPhotoId === id) setCoverPhotoId(next[0]?.id || null);
      return next;
    });
  }

  function makeCover(id) {
    setCoverPhotoId(id);
    setUploadError('');
  }

  function toggleContact(method) {
    setForm((prev) => {
      const exists = prev.contactMethods.includes(method);
      const next = exists ? prev.contactMethods.filter((item) => item !== method) : [...prev.contactMethods, method];
      return { ...prev, contactMethods: next.length ? next : ['message'] };
    });
  }

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setUploadError('');
    setFieldErrors({});

    const location = [form.city, form.district, form.neighborhood].filter(Boolean).join(', ');
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'İlan başlığı zorunludur.';
    if (!form.price) nextErrors.price = 'Fiyat zorunludur.';
    if (!location.trim()) nextErrors.location = 'Konum seçimi zorunludur.';
    if (path.length < 2 && path[0]?.id !== 'urgent') {
      nextErrors.category = 'Kategori ve alt kategori seçmelisin. Acil Acil hariç en az 2 seviye gerekli.';
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    const categoryId = path[0]?.id || '';
    const subcategoryId = selectedNode?.id || '';
    const inferredBrand = inferBrandFromPath(path);
    const cleanedAttributes = Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [key, ['mileage','engineHours','rangeKm','areaM2','deposit'].includes(key) ? parseNumberInput(value) : value])
    );
    if (inferredBrand && !cleanedAttributes.brand) cleanedAttributes.brand = inferredBrand;
    const photoFiles = photos.slice(0, maxPhotos).map((photo) => photo.file).filter(Boolean);
    const photoValidation = validateListingImages(photoFiles, maxPhotos);
    if (photoValidation.ok === false) {
      setUploadError(photoValidation.error);
      return;
    }

    try {
      setSubmitting(true);
      await onCreate({
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
        photos: photos.slice(0, maxPhotos),
        coverPhotoId: activeCoverPhotoId,
        image_url: form.image || '',
        images: form.image ? [form.image] : [],
        cover_image_url: form.image && !photos.length ? form.image : '',
        status: 'pending',
      });
    } catch (error) {
      setUploadError(error.message || 'Fotoğraflar yüklenemedi veya ilan kaydedilemedi.');
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 p-0 backdrop-blur-sm sm:p-2 md:p-5" onClick={() => onClose?.()}>
      <div onClick={(event) => event.stopPropagation()} className="mx-auto flex h-[100dvh] max-w-6xl flex-col overflow-hidden bg-white text-slate-950 shadow-2xl dark:bg-slate-950 dark:text-white sm:max-h-[96dvh] sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 dark:border-white/10 dark:bg-slate-900/95 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black sm:text-xl">İlan Ver</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kategori seç, bilgileri doldur ve incelenmek üzere gönder.</p>
          </div>
          <button type="button" onClick={() => onClose?.()} className="rounded-2xl bg-slate-100 p-2 text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[340px_minmax(0,1fr)] lg:overflow-hidden">
          <aside className="min-w-0 border-b border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/70 lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r">
            <div className="mb-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-950/50 dark:ring-white/10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black">Kategori yolu</h3>
                {path.length > 0 && <button type="button" onClick={() => { setPath([]); setAttributes({}); }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-white/10 dark:text-slate-200">Değiştir</button>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                {path.length ? path.map((x, i) => <span key={x.id} className="inline-flex min-w-0 items-center gap-1"><span className="truncate">{x.label}</span>{i < path.length - 1 && <ChevronRight size={12} />}</span>) : 'Henüz kategori seçilmedi'}
              </div>
              {fieldErrors.category ? <p className="mt-2 text-xs font-bold text-rose-600">{fieldErrors.category}</p> : null}
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{path[0] ? 'Seçilen ana kategori' : 'Ana kategori'}</div>
                <div className="grid gap-2">
                  {(path[0] ? [path[0]] : CATEGORY_TREE).map((node) => (
                    <button key={node.id} type="button" onClick={() => selectNode(node, 0)} className={`flex min-w-0 items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-black ring-1 ${path[0]?.id === node.id ? 'bg-cyan-600 text-white ring-cyan-500' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10'}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100 dark:bg-white/10"><TopCategoryIcon id={node.id} /></span>
                      <span className="min-w-0 flex-1 truncate">{node.label}</span>
                      <span className="shrink-0 text-[11px] font-bold text-slate-400 dark:text-slate-500">{Number(node.count || 0).toLocaleString('tr-TR')}</span>
                      {node.children?.length ? <ChevronRight className="shrink-0" size={14} /> : null}
                    </button>
                  ))}
                </div>
              </div>

              {path.slice(1).map((node, index) => (
                <div key={node.id}>
                  <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Seçilen {index + 2}. seviye</div>
                  <button type="button" onClick={() => selectNode(node, index + 1)} className="flex w-full min-w-0 items-center gap-2 rounded-2xl bg-cyan-600 px-3 py-2.5 text-left text-sm font-black text-white ring-1 ring-cyan-500">
                    <span className="min-w-0 flex-1 truncate">{node.label}</span>
                    <span className="shrink-0 text-[11px] font-bold text-white/75">{Number(node.count || 0).toLocaleString('tr-TR')}</span>
                    {node.children?.length ? <ChevronRight className="shrink-0" size={14} /> : null}
                  </button>
                </div>
              ))}

              {selectedNode?.children?.length ? (
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{path.length + 1}. seviye seçenekleri</div>
                  <div className="grid gap-2">
                    {selectedNode.children.map((child) => (
                      <button key={child.id} type="button" onClick={() => selectNode(child, path.length)} className="flex min-w-0 items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5 text-left text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-cyan-400/10 dark:hover:text-cyan-200 dark:hover:ring-cyan-300/20">
                        <span className="min-w-0 flex-1 truncate">{child.label}</span>
                        <span className="shrink-0 text-[11px] font-bold text-slate-400 dark:text-slate-500">{Number(child.count || 0).toLocaleString('tr-TR')}</span>
                        {child.children?.length ? <ChevronRight className="shrink-0" size={14} /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <main className="min-w-0 bg-white p-3 dark:bg-slate-950 sm:p-4 md:p-6 lg:overflow-y-auto">
            <div className="mb-4 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">İlan haklarım</div>
                  <div className="mt-1 text-sm font-black">
                    {isPremiumSeller
                      ? 'Premium Satıcı hesabınla sınırsız standart ilan verebilirsin.'
                      : requiresPayment
                        ? `Ücretsiz ilan hakkın doldu. Standart ilan ücreti: ${formatXpfAmount(entitlements.standardListingPrice)}.`
                        : `Bu yıl 1 ücretsiz ilan hakkından kullanıyorsun. Kalan hak: ${entitlements.freeListingRemaining}.`}
                  </div>
                  <p className="mt-1 text-xs font-semibold opacity-80">
                    En fazla {maxPhotos} fotoğraf · dosya başına {MAX_LISTING_IMAGE_SIZE_MB} MB limiti. {entitlements.canAddVideo ? 'Video ekleme hakkın aktif.' : 'Video ekleme Premium Satıcı ile açılır.'}
                  </p>
                </div>
                {requiresPayment ? (
                  <button type="button" onClick={() => onOpenPricing?.()} className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white dark:bg-cyan-500 dark:text-slate-950">
                    Ödeme veya paket seç
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-blue-50 p-4 text-blue-800 ring-1 ring-blue-100 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-300/20"><Sparkles size={18}/><div className="mt-2 text-2xl font-black">{qualityScore}%</div><div className="text-xs font-bold">İlan kalite skoru</div></div>
              <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/20"><ShieldCheck size={18}/><div className="mt-2 text-sm font-black">Onay sonrası yayında</div><div className="text-xs font-bold">Güvenli moderasyon</div></div>
              <div className="rounded-3xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/20"><AlertCircle size={18}/><div className="mt-2 text-sm font-black">Eksik bilgi dönüşümü düşürür</div><div className="text-xs font-bold">Fotoğraf + açıklama şart</div></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <RequiredLabel>İlan başlığı</RequiredLabel>
                <input value={form.title} onChange={(e)=>{ setForm({...form,title:e.target.value}); setFieldErrors((c)=>({...c,title:''})); }} placeholder="Örn: Kiralık F2 daire, Anse Vata" className={inputClass} />
                {fieldErrors.title ? <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.title}</p> : null}
              </label>
              <label>
                <RequiredLabel>Fiyat</RequiredLabel>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={form.price} onChange={(e)=>{ setForm({...form,price:formatNumberInput(e.target.value)}); setFieldErrors((c)=>({...c,price:''})); }} placeholder="875.000" className={`${inputClass} pr-14`} />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-black text-slate-400">XPF</span>
                </div>
                {fieldErrors.price ? <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.price}</p> : <p className="mt-1 text-[11px] font-semibold text-slate-400">Pazarlık için boş bırakma; görüşülür ilanlar için 0 yazabilirsin.</p>}
              </label>
              <div className="grid gap-3 sm:grid-cols-3 md:col-span-1">
                <label><RequiredLabel>Konum · Şehir</RequiredLabel><select value={form.city} onChange={(e)=>{ const nextCity = e.target.value; setForm({...form, city: nextCity, district: (NEW_CALEDONIA_LOCATIONS[nextCity] || [''])[0] || '', neighborhood: ''}); setFieldErrors((c)=>({...c,location:''})); }} className={inputClass}>{CITY_OPTIONS.map((city)=><option key={city}>{city}</option>)}</select></label>
                <label><RequiredLabel>Semt</RequiredLabel><select value={form.district} onChange={(e)=>{ setForm({...form,district:e.target.value}); setFieldErrors((c)=>({...c,location:''})); }} className={inputClass}>{visibleDistricts.map((item)=><option key={item}>{item}</option>)}</select></label>
                <label><span className={labelClass}>Mahalle</span><input value={form.neighborhood} onChange={(e)=>setForm({...form,neighborhood:e.target.value})} placeholder="Opsiyonel" className={inputClass} /></label>
              </div>
              {fieldErrors.location ? <p className="md:col-span-2 text-xs font-bold text-rose-600">{fieldErrors.location}</p> : null}
              <label className="md:col-span-2">
                <span className={labelClass}>Açıklama</span>
                <textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} rows={5} placeholder="Durum, kusur, teslimat ve pazarlık bilgisini net yaz. En az 80 karakter önerilir." className={inputClass} />
              </label>
            </div>

            {fields.length > 0 && <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"><h3 className="mb-3 font-black">Kategoriye özel bilgiler</h3><div className="grid gap-4 md:grid-cols-2">{fields.map((fieldKey)=><FieldInput key={fieldKey} fieldKey={fieldKey} selectedNode={selectedNode} value={attributes[fieldKey]} onChange={(value)=>setAttributes({...attributes,[fieldKey]:value})}/>)}</div></div>}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-black">Fotoğraflar</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {photos.length}/{maxPhotos} fotoğraf · JPG/PNG/WebP · en fazla {MAX_LISTING_IMAGE_SIZE_MB} MB/dosya
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-400">İlk fotoğraf veya seçtiğin kapak, ilanda öne çıkar.</p>
                </div>
                {activeCoverPhotoId ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200">Kapak seçili</span> : null}
              </div>
              {uploadError ? <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/20">{uploadError}</div> : null}
              <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); addFiles(e.dataTransfer.files);}} className="mt-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-slate-950/50">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="grid h-24 w-full place-items-center rounded-3xl bg-white text-slate-400 dark:bg-white/5 dark:text-slate-500 md:w-32"><UploadCloud size={34}/></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black">Fotoğrafları sürükle bırak veya seç</div>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Kapak seçmezsen ilk fotoğraf otomatik kapak olur. Aynı dosya tekrar eklenmez.</p>
                    {photos.length ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {photos.map((photo) => (
                          <PhotoCard
                            key={photo.id}
                            photo={photo}
                            isCover={activeCoverPhotoId === photo.id}
                            autoCover={!coverPhotoId && photos[0]?.id === photo.id}
                            onRemove={() => removePhoto(photo.id)}
                            onMakeCover={() => makeCover(photo.id)}
                          />
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={photos.length >= maxPhotos} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-500">Dosya seç</button>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>addFiles(e.target.files)} />
                      <input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder="veya https:// görsel URL" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex items-center justify-between gap-3"><h3 className="font-black">Satıcı bilgileri</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">Üyelik bilgileri kullanılacak</span></div>
              <div className="mt-3 flex items-center gap-3 rounded-3xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white">{(form.sellerName || form.sellerEmail || 'N').slice(0,1).toUpperCase()}</div>
                <div className="min-w-0"><div className="truncate font-black">{form.sellerName || 'Satıcı'}</div><div className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">{form.sellerEmail || 'E-posta yok'}</div></div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <h3 className="font-black">İletişim tercihleri</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <button type="button" onClick={()=>toggleContact('message')} className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${form.contactMethods.includes('message') ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10'}`}><MessageCircle className="mr-2 inline" size={16}/>Site içi mesaj</button>
                <button type="button" onClick={()=>toggleContact('phone')} className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${form.contactMethods.includes('phone') ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10'}`}><Phone className="mr-2 inline" size={16}/>Telefon</button>
                <button type="button" onClick={()=>toggleContact('whatsapp')} className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${form.contactMethods.includes('whatsapp') ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10'}`}><Globe2 className="mr-2 inline" size={16}/>WhatsApp</button>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="font-black">Önizleme</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Yayına gitmeden önce alıcının göreceği özeti kontrol et.</p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
                <div className="grid gap-3 p-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                    {photos[0]?.previewUrl || form.image ? (
                      <img src={photos.find((p) => p.id === activeCoverPhotoId)?.previewUrl || photos[0]?.previewUrl || form.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] font-bold text-slate-400">Fotoğraf yok</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-black text-cyan-700 dark:text-cyan-300">{form.price ? `${form.price} XPF` : 'Görüşülür'}</div>
                    <div className="mt-1 line-clamp-2 text-sm font-black text-slate-950 dark:text-white">{form.title || 'İlan başlığı'}</div>
                    <div className="mt-1 truncate text-xs font-semibold text-slate-500">{categoryLabel || 'Kategori seçilmedi'}</div>
                    <div className="mt-1 truncate text-xs font-semibold text-slate-500">{[form.city, form.district, form.neighborhood].filter(Boolean).join(', ') || 'Konum'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
              Gönderdiğinde ilanın <strong>Onay bekliyor</strong> durumuna geçer. İlanınız incelenmek üzere gönderildi mesajını göreceksin; admin onayından sonra yayına alınır.
            </div>

            <div className="sticky bottom-0 z-10 mt-6 grid gap-2 border-t border-slate-200 bg-white/95 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:flex sm:justify-end sm:gap-3">
              <button type="button" onClick={onClose} disabled={submitting} className="min-h-[48px] rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-50 dark:bg-white/10 dark:text-slate-200">Vazgeç</button>
              <button type="submit" disabled={submitting} className="min-h-[48px] rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-500 sm:min-w-[220px] sm:px-6">
                {submitting ? 'Gönderiliyor...' : 'İlanı yayınla'}
              </button>
            </div>
          </main>
        </form>
      </div>
    </div>
  );
}
