'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Upload,
  ImagePlus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Car,
  Home,
  Ship,
  Smartphone,
  Sofa,
  BriefcaseBusiness,
  PawPrint,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { categories, locations } from '@/lib/categories';

const MAX_IMAGES = 8;

const categoryConfig = {
  Araç: {
    icon: Car,
    subcategories: ['Otomobil', 'SUV / 4x4', 'Pickup', 'Motosiklet', 'Kamyonet', 'Yedek parça'],
    fields: [
      { key: 'brand', label: 'Marka', placeholder: 'Toyota, Hyundai, Peugeot...' },
      { key: 'model', label: 'Model', placeholder: 'Hilux, Tucson, 208...' },
      { key: 'year', label: 'Yıl', type: 'number', placeholder: '2018' },
      { key: 'mileage', label: 'Kilometre', type: 'number', placeholder: '85000' },
      { key: 'fuel', label: 'Yakıt', type: 'select', options: ['Benzin', 'Dizel', 'Hibrit', 'Elektrik', 'Diğer'] },
      { key: 'transmission', label: 'Vites', type: 'select', options: ['Otomatik', 'Manuel'] },
    ],
  },
  Emlak: {
    icon: Home,
    subcategories: ['Kiralık ev', 'Satılık ev', 'Arsa', 'Ofis / işyeri', 'Oda / paylaşım'],
    fields: [
      { key: 'property_type', label: 'Emlak tipi', type: 'select', options: ['Daire', 'Müstakil ev', 'Villa', 'Arsa', 'İşyeri', 'Oda'] },
      { key: 'rooms', label: 'Oda sayısı', placeholder: '2+1, 3+1...' },
      { key: 'area_m2', label: 'm²', type: 'number', placeholder: '85' },
      { key: 'floor', label: 'Kat', placeholder: 'Bahçe, 2. kat...' },
      { key: 'furnished', label: 'Eşyalı mı?', type: 'select', options: ['Belirtilmedi', 'Evet', 'Hayır'] },
      { key: 'deposit', label: 'Depozito', type: 'number', placeholder: '100000' },
    ],
  },
  Denizcilik: {
    icon: Ship,
    subcategories: ['Tekne', 'Bot', 'Jet ski', 'Motor', 'Ekipman', 'Marina hizmeti'],
    fields: [
      { key: 'marine_type', label: 'Tip', placeholder: 'Tekne, bot, dıştan takma motor...' },
      { key: 'brand', label: 'Marka', placeholder: 'Yamaha, Mercury...' },
      { key: 'year', label: 'Yıl', type: 'number', placeholder: '2020' },
      { key: 'engine_hours', label: 'Motor saati', type: 'number', placeholder: '350' },
    ],
  },
  Elektronik: {
    icon: Smartphone,
    subcategories: ['Telefon', 'Bilgisayar', 'Tablet', 'TV / Ses', 'Kamera', 'Oyun konsolu'],
    fields: [
      { key: 'brand', label: 'Marka', placeholder: 'Apple, Samsung, Lenovo...' },
      { key: 'model', label: 'Model', placeholder: 'iPhone 14, ThinkPad...' },
      { key: 'warranty', label: 'Garanti', type: 'select', options: ['Belirtilmedi', 'Var', 'Yok'] },
    ],
  },
  'Ev & Yaşam': {
    icon: Sofa,
    subcategories: ['Mobilya', 'Beyaz eşya', 'Dekorasyon', 'Bahçe', 'Mutfak'],
    fields: [
      { key: 'brand', label: 'Marka', placeholder: 'Varsa marka' },
      { key: 'dimensions', label: 'Ölçüler', placeholder: '200x90 cm...' },
    ],
  },
  'İş / Hizmet': {
    icon: BriefcaseBusiness,
    subcategories: ['İş ilanı', 'Usta / servis', 'Temizlik', 'Nakliye', 'Özel ders', 'Danışmanlık'],
    fields: [
      { key: 'service_area', label: 'Hizmet bölgesi', placeholder: 'Nouméa, Dumbéa...' },
      { key: 'availability', label: 'Uygunluk', placeholder: 'Hafta içi, hafta sonu...' },
    ],
  },
  'Yedek Parça': {
    icon: Wrench,
    subcategories: ['Araç parçası', 'Tekne parçası', 'Makine parçası', 'Elektronik parça'],
    fields: [
      { key: 'brand', label: 'Marka', placeholder: 'Toyota, Yamaha...' },
      { key: 'part_number', label: 'Parça no', placeholder: 'Varsa OEM / referans no' },
      { key: 'compatibility', label: 'Uyumluluk', placeholder: 'Hangi model/yıl ile uyumlu?' },
    ],
  },
  Hayvanlar: {
    icon: PawPrint,
    subcategories: ['Kedi', 'Köpek', 'Kuş', 'Balık', 'Ekipman'],
    fields: [
      { key: 'animal_age', label: 'Yaş', placeholder: '2 aylık, 1 yaş...' },
      { key: 'vaccinated', label: 'Aşı durumu', type: 'select', options: ['Belirtilmedi', 'Aşılı', 'Aşısız'] },
    ],
  },
  Diğer: {
    icon: Package,
    subcategories: ['Genel', 'Koleksiyon', 'Spor', 'Kişisel eşya'],
    fields: [],
  },
};

const conditions = [
  { value: 'new', label: 'Yeni' },
  { value: 'like_new', label: 'Yeni gibi' },
  { value: 'used', label: 'Kullanılmış' },
  { value: 'needs_repair', label: 'Tamir gerekir' },
];

function getConfig(category) {
  return categoryConfig[category] || categoryConfig.Diğer;
}

function formatXpf(value) {
  const number = Number(value || 0);
  if (!number) return 'Görüşülür';
  return `${number.toLocaleString('fr-FR')} XPF`;
}

async function compressImage(file) {
  if (!file || !file.type?.startsWith('image/')) return file;
  if (file.size < 450_000 || typeof window === 'undefined') return file;

  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}

export default function ListingForm({ onClose, onCreate, user, profile }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [form, setForm] = useState({
    title: '',
    category: 'Araç',
    subcategory: 'Otomobil',
    condition: 'used',
    price: '',
    location: 'Nouméa',
    seller_name: profile?.full_name || '',
    seller_phone: profile?.phone || '',
    seller_email: user?.email || '',
    image_url: '',
    description: '',
    premium_requested: false,
    metadata: {},
  });

  const config = getConfig(form.category);
  const totalSteps = 5;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      seller_name: current.seller_name || profile?.full_name || '',
      seller_phone: current.seller_phone || profile?.phone || '',
      seller_email: current.seller_email || user?.email || '',
    }));
  }, [profile?.full_name, profile?.phone, user?.email]);

  const previews = useMemo(() => {
    const filePreviews = imageFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: 'file',
    }));

    if (!filePreviews.length && form.image_url) {
      return [{ name: 'URL fotoğrafı', url: form.image_url, type: 'url' }];
    }

    return filePreviews;
  }, [imageFiles, form.image_url]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMetadata(key, value) {
    setForm((current) => ({
      ...current,
      metadata: {
        ...(current.metadata || {}),
        [key]: value,
      },
    }));
  }

  function selectCategory(nextCategory) {
    const nextConfig = getConfig(nextCategory);
    setForm((current) => ({
      ...current,
      category: nextCategory,
      subcategory: nextConfig.subcategories?.[0] || 'Genel',
      metadata: {},
    }));
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;

    setCompressing(true);
    try {
      const compressed = [];
      for (const file of files) {
        compressed.push(await compressImage(file));
      }
      setImageFiles((current) => [...current, ...compressed].slice(0, MAX_IMAGES));
      update('image_url', '');
    } finally {
      setCompressing(false);
    }
  }

  function removeImage(index) {
    setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  function getStepError(targetStep = step) {
    const title = form.title.trim();
    const description = form.description.trim();
    const sellerName = form.seller_name.trim();
    const sellerPhone = form.seller_phone.trim();

    if (targetStep === 1 && (!form.category || !form.subcategory)) {
      return 'Kategori ve alt kategori seçmelisin.';
    }

    if (targetStep === 2) {
      if (title.length < 3) return 'Başlık en az 3 karakter olmalı.';
      if (!form.location) return 'Konum seçmelisin.';
      if (description.length < 5) return 'Açıklama en az 5 karakter olmalı.';
    }

    if (targetStep === 4) {
      if (sellerName.length < 2) return 'Satıcı adı en az 2 karakter olmalı.';
      if (sellerPhone.length < 3) return 'Telefon / WhatsApp alanını doldurmalısın.';
    }

    return '';
  }

  function validateStep(targetStep = step) {
    return !getStepError(targetStep);
  }

  function nextStep() {
    const error = getStepError(step);
    if (error) {
      alert(error);
      return;
    }
    setStep((current) => Math.min(totalSteps, current + 1));
  }

  function previousStep() {
    setStep((current) => Math.max(1, current - 1));
  }

  async function submit(e) {
    e.preventDefault();

    for (const requiredStep of [1, 2, 4]) {
      const error = getStepError(requiredStep);
      if (error) {
        alert(error);
        setStep(requiredStep);
        return;
      }
    }

    setLoading(true);
    try {
      await onCreate({ ...form, image_files: imageFiles });
    } finally {
      setLoading(false);
    }
  }

  const StepIcon = config.icon || Package;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 p-3 backdrop-blur-sm md:p-4">
      <form onSubmit={submit} className="mx-auto flex max-h-[94vh] max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              <Sparkles size={14} /> Profesyonel ilan wizard
            </div>
            <h2 className="text-2xl font-black text-slate-950">İlan ver</h2>
            <p className="mt-1 text-sm text-slate-500">Kategori, detay, fotoğraf, iletişim ve önizleme. Yayın öncesi admin onayı gerekir.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <div className="grid gap-2 md:grid-cols-5">
            {['Kategori', 'Detaylar', 'Fotoğraflar', 'İletişim', 'Önizleme'].map((label, index) => {
              const number = index + 1;
              const active = step === number;
              const done = step > number;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(number)}
                  className={`rounded-2xl px-3 py-3 text-left text-xs font-black transition ${active ? 'bg-slate-950 text-white' : done ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'}`}
                >
                  <span className="mb-1 flex items-center gap-2">
                    {done ? <CheckCircle2 size={15} /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[11px] ring-1 ring-current/20">{number}</span>}
                    Adım {number}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid flex-1 overflow-auto lg:grid-cols-[1fr_360px]">
          <div className="p-5 md:p-6">
            {step === 1 && (
              <section>
                <h3 className="text-xl font-black">Kategori seç</h3>
                <p className="mt-1 text-sm text-slate-500">Sahibinden mantığı burada başlar: kategori doğruysa filtreler ve ilan kalitesi yükselir.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {categories.map((categoryName) => {
                    const itemConfig = getConfig(categoryName);
                    const Icon = itemConfig.icon || Package;
                    const active = form.category === categoryName;
                    return (
                      <button
                        key={categoryName}
                        type="button"
                        onClick={() => selectCategory(categoryName)}
                        className={`rounded-3xl p-4 text-left transition ${active ? 'bg-slate-950 text-white shadow-xl' : 'bg-white ring-1 ring-slate-200 hover:bg-slate-50'}`}
                      >
                        <Icon size={24} />
                        <div className="mt-3 text-base font-black">{categoryName}</div>
                        <div className={`mt-1 text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>{itemConfig.subcategories?.slice(0, 3).join(' · ')}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500">Alt kategori</label>
                  <select value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none">
                    {config.subcategories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </section>
            )}

            {step === 2 && (
              <section>
                <h3 className="text-xl font-black">İlan bilgileri</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="İlan başlığı" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
                  <input value={form.price} onChange={(e) => update('price', e.target.value)} type="number" placeholder="Fiyat / XPF" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                  <select required value={form.location} onChange={(e) => update('location', e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                    {locations.map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <select value={form.condition} onChange={(e) => update('condition', e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2">
                    {conditions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>

                  {config.fields.map((field) => {
                    const value = form.metadata?.[field.key] || '';
                    if (field.type === 'select') {
                      return (
                        <select key={field.key} value={value} onChange={(e) => updateMetadata(field.key, e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
                          <option value="">{field.label}</option>
                          {field.options.map((option) => <option key={option}>{option}</option>)}
                        </select>
                      );
                    }
                    return (
                      <input key={field.key} value={value} onChange={(e) => updateMetadata(field.key, e.target.value)} type={field.type || 'text'} placeholder={`${field.label}${field.placeholder ? ` — ${field.placeholder}` : ''}`} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                    );
                  })}

                  <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Açıklama: ürünün durumu, kusurları, teslimat/konum bilgisi, pazarlık durumu..." rows={6} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
                </div>
              </section>
            )}

            {step === 3 && (
              <section>
                <h3 className="text-xl font-black">Fotoğraflar</h3>
                <p className="mt-1 text-sm text-slate-500">İlk fotoğraf kapak olur. Büyük görseller otomatik sıkıştırılır.</p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
                  className={`mt-5 rounded-3xl border border-dashed p-5 transition ${dragActive ? 'border-slate-900 bg-slate-100' : 'border-slate-300 bg-slate-50'}`}
                >
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200 hover:bg-slate-50">
                    <ImagePlus className="mb-2 text-slate-500" size={34} />
                    <div className="text-sm font-black text-slate-800">Fotoğraf seç veya buraya sürükle</div>
                    <div className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP veya GIF. En fazla {MAX_IMAGES} fotoğraf.</div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                  </label>

                  {compressing && <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">Fotoğraflar optimize ediliyor...</div>}

                  {previews.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                      {previews.map((preview, index) => (
                        <div key={`${preview.name}-${index}`} className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                          <img src={preview.url} alt="İlan önizleme" className="h-32 w-full object-cover" />
                          <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-black text-slate-700 shadow-sm">{index === 0 ? 'Kapak' : index + 1}</div>
                          {preview.type === 'file' && (
                            <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input value={form.image_url} onChange={(e) => { setImageFiles([]); update('image_url', e.target.value); }} placeholder="Alternatif: Fotoğraf URL" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              </section>
            )}

            {step === 4 && (
              <section>
                <h3 className="text-xl font-black">Satıcı iletişim bilgileri</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <input required value={form.seller_name} onChange={(e) => update('seller_name', e.target.value)} placeholder="Satıcı adı" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                  <input required value={form.seller_phone} onChange={(e) => update('seller_phone', e.target.value)} placeholder="Telefon / WhatsApp" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                  <input value={form.seller_email} onChange={(e) => update('seller_email', e.target.value)} placeholder="E-posta" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
                  <input type="checkbox" checked={form.premium_requested} onChange={(e) => update('premium_requested', e.target.checked)} className="mt-1" />
                  <span>
                    <span className="block text-sm font-black text-amber-900">Bu ilanı premium yapmak istiyorum</span>
                    <span className="mt-1 block text-xs leading-5 text-amber-800">Ödeme entegrasyonu tamamlandığında ilan öne çıkarma akışına bağlanacak. Şimdilik talep bilgisi metadata içinde saklanır.</span>
                  </span>
                </label>
              </section>
            )}

            {step === 5 && (
              <section>
                <h3 className="text-xl font-black">Önizleme ve gönderim</h3>
                <p className="mt-1 text-sm text-slate-500">Kontrol et. Hata varsa geri dön. Gönderince ilan onaya düşer.</p>
                <div className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
                  <img src={previews[0]?.url || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80'} alt="Kapak" className="h-72 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{form.category}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{form.subcategory}</span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Onay bekleyecek</span>
                    </div>
                    <h4 className="mt-3 text-2xl font-black">{form.title || 'İlan başlığı'}</h4>
                    <div className="mt-2 text-2xl font-black text-slate-950">{formatXpf(form.price)}</div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{form.description || 'Açıklama girilmedi.'}</p>
                    <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-3"><b>Konum:</b> {form.location}</div>
                      <div className="rounded-2xl bg-slate-50 p-3"><b>Satıcı:</b> {form.seller_name || '-'}</div>
                      {Object.entries(form.metadata || {}).filter(([, value]) => value).map(([key, value]) => (
                        <div key={key} className="rounded-2xl bg-slate-50 p-3"><b>{key}:</b> {value}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
            <div className="sticky top-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><StepIcon size={22} /></div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-slate-500">Seçilen kategori</div>
                  <div className="text-lg font-black">{form.category}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between gap-3"><span>Alt kategori</span><b className="text-slate-900">{form.subcategory}</b></div>
                <div className="flex justify-between gap-3"><span>Fiyat</span><b className="text-slate-900">{formatXpf(form.price)}</b></div>
                <div className="flex justify-between gap-3"><span>Fotoğraf</span><b className="text-slate-900">{previews.length}/{MAX_IMAGES}</b></div>
                <div className="flex justify-between gap-3"><span>Konum</span><b className="text-slate-900">{form.location}</b></div>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-200">
                Kaliteli ilan = net başlık + gerçek fotoğraf + kusurları saklamayan açıklama. Bu platformda güveni böyle kuracağız.
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={previousStep} disabled={step === 1} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-40"><ArrowLeft size={16} /> Geri</button>
          {step < totalSteps ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Devam <ArrowRight size={16} /></button>
          ) : (
            <button disabled={loading || compressing} type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
              <Upload size={17} /> {loading ? 'Kaydediliyor...' : 'İlanı Onaya Gönder'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
