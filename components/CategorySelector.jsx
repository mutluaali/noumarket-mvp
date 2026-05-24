'use client';

import {
  Car,
  Home,
  Ship,
  Smartphone,
  Sofa,
  BriefcaseBusiness,
  PawPrint,
  Package,
  Wrench,
  ChevronRight,
  CheckCircle2,
  Search,
} from 'lucide-react';

const icons = {
  Araç: Car,
  Emlak: Home,
  Denizcilik: Ship,
  Elektronik: Smartphone,
  'Ev & Yaşam': Sofa,
  'İş / Hizmet': BriefcaseBusiness,
  'Yedek Parça': Wrench,
  Hayvanlar: PawPrint,
  Diğer: Package,
};

const brandMap = {
  Araç: [
    'Toyota', 'Nissan', 'Renault', 'Peugeot', 'Citroën', 'Ford', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Mitsubishi', 'Suzuki', 'Honda',
    'Jeep', 'Land Rover', 'Isuzu', 'Fiat', 'Opel', 'Chevrolet', 'Dacia', 'Diğer',
  ],
  Elektronik: [
    'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Sony', 'LG', 'Lenovo', 'HP', 'Dell',
    'Asus', 'Acer', 'Canon', 'Nikon', 'GoPro', 'Microsoft', 'Nintendo', 'PlayStation', 'Diğer',
  ],
  Denizcilik: [
    'Yamaha', 'Mercury', 'Suzuki Marine', 'Honda Marine', 'Tohatsu', 'Beneteau',
    'Jeanneau', 'Zodiac', 'Sea-Doo', 'Bayliner', 'Quicksilver', 'Diğer',
  ],
  'Yedek Parça': [
    'Toyota', 'Nissan', 'Renault', 'Ford', 'BMW', 'Mercedes-Benz', 'Yamaha',
    'Mercury', 'Bosch', 'Valeo', 'NGK', 'Denso', 'Diğer',
  ],
  'Ev & Yaşam': [
    'Samsung', 'LG', 'Bosch', 'Beko', 'Arçelik', 'Whirlpool', 'IKEA', 'Conforama', 'Diğer',
  ],
};

const modelMap = {
  Nissan: ['Qashqai', 'Micra', 'Note', 'Juke', 'X-Trail', 'Navara', 'Pathfinder', 'Patrol', '370Z', 'GT-R', 'Diğer'],
  Toyota: ['Yaris', 'Corolla', 'Camry', 'RAV4', 'Hilux', 'Land Cruiser', 'Prado', 'Hiace', 'C-HR', 'Diğer'],
  Renault: ['Clio', 'Megane', 'Captur', 'Kadjar', 'Koleos', 'Kangoo', 'Trafic', 'Master', 'Diğer'],
  Peugeot: ['208', '308', '2008', '3008', '5008', 'Partner', 'Expert', 'Diğer'],
  Citroën: ['C3', 'C4', 'C5 Aircross', 'Berlingo', 'Jumpy', 'Diğer'],
  Ford: ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Ranger', 'Transit', 'Mustang', 'Diğer'],
  BMW: ['1 Serisi', '2 Serisi', '3 Serisi', '4 Serisi', '5 Serisi', 'X1', 'X3', 'X5', 'X6', 'Diğer'],
  'Mercedes-Benz': ['A Serisi', 'C Serisi', 'E Serisi', 'S Serisi', 'GLA', 'GLC', 'GLE', 'Vito', 'Sprinter', 'Diğer'],
  Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'TT', 'Diğer'],
  Volkswagen: ['Polo', 'Golf', 'Passat', 'Tiguan', 'T-Roc', 'Transporter', 'Caddy', 'Amarok', 'Diğer'],
  Hyundai: ['i10', 'i20', 'i30', 'Kona', 'Tucson', 'Santa Fe', 'H-1', 'Diğer'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Sportage', 'Sorento', 'Diğer'],
  Mazda: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'BT-50', 'Diğer'],
  Mitsubishi: ['Space Star', 'ASX', 'Outlander', 'L200', 'Pajero', 'Diğer'],
  Suzuki: ['Swift', 'Vitara', 'Jimny', 'S-Cross', 'Baleno', 'Diğer'],
  Honda: ['Jazz', 'Civic', 'Accord', 'HR-V', 'CR-V', 'PCX', 'CBR', 'Diğer'],
  Apple: ['iPhone', 'iPad', 'MacBook Air', 'MacBook Pro', 'iMac', 'Apple Watch', 'AirPods', 'Diğer'],
  Samsung: ['Galaxy S', 'Galaxy A', 'Galaxy Note', 'Galaxy Tab', 'TV', 'Buzdolabı', 'Çamaşır Makinesi', 'Diğer'],
  Yamaha: ['NMAX', 'XMAX', 'MT-07', 'MT-09', 'R1', 'R6', 'Outboard Motor', 'Jet Ski', 'Diğer'],
  Mercury: ['FourStroke', 'SeaPro', 'Verado', 'Optimax', 'Diğer'],
};

function countLabel(index, base = 12) {
  return Math.max(1, base - index);
}

function CategoryButton({ active, children, onClick, muted = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition',
        active
          ? 'bg-slate-950 text-white shadow-sm'
          : muted
            ? 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-white hover:text-slate-900'
            : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-950',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Column({ title, subtitle, children }) {
  return (
    <div className="min-h-[420px] rounded-[1.35rem] bg-white p-3 ring-1 ring-slate-200">
      <div className="mb-3 px-1">
        <div className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</div>
        {subtitle ? <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{subtitle}</div> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function CategorySelector({
  form,
  categoryConfig,
  onSelectCategory,
  onSelectSubcategory,
  onUpdateMetadata,
}) {
  const categories = Object.keys(categoryConfig || {});
  const currentConfig = categoryConfig?.[form.category] || {};
  const subcategories = currentConfig.subcategories || [];
  const brands = brandMap[form.category] || [];
  const selectedBrand = form.metadata?.brand || '';
  const selectedModel = form.metadata?.model || '';
  const models = selectedBrand ? (modelMap[selectedBrand] || ['Diğer']) : [];

  const CategoryIcon = icons[form.category] || Package;

  function chooseCategory(categoryName) {
    const nextConfig = categoryConfig[categoryName] || {};
    onSelectCategory(categoryName);

    if (nextConfig.subcategories?.[0]) {
      onSelectSubcategory(nextConfig.subcategories[0]);
    }

    onUpdateMetadata('brand', '');
    onUpdateMetadata('model', '');
  }

  function chooseSubcategory(subcategoryName) {
    onSelectSubcategory(subcategoryName);
    onUpdateMetadata('brand', '');
    onUpdateMetadata('model', '');
  }

  function chooseBrand(brandName) {
    onUpdateMetadata('brand', brandName);
    onUpdateMetadata('model', '');
  }

  function chooseModel(modelName) {
    onUpdateMetadata('model', modelName);
  }

  const path = [
    form.category,
    form.subcategory,
    selectedBrand,
    selectedModel,
  ].filter(Boolean);

  return (
    <section>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">Kategori seç</h3>
          <p className="mt-1 text-sm text-slate-500">
            Ana kategori seçtikçe alt seçenekler açılır. Doğru kategori, doğru alıcıya ulaşmanın ilk adımıdır.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">Seçim yolu</div>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-sm font-black text-slate-900">
            {path.map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-1">
                {index > 0 ? <ChevronRight size={14} className="text-slate-400" /> : null}
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1fr_320px]">
        <Column title="1. Ana kategori" subtitle="İlanın ana grubu">
          {categories.map((categoryName) => {
            const Icon = icons[categoryName] || Package;
            const active = form.category === categoryName;

            return (
              <CategoryButton key={categoryName} active={active} onClick={() => chooseCategory(categoryName)}>
                <span className="flex min-w-0 items-center gap-2">
                  <Icon size={17} />
                  <span className="truncate font-black">{categoryName}</span>
                </span>
                <span className={active ? 'text-white/75' : 'text-slate-400'}>{countLabel(categories.indexOf(categoryName), 42)}</span>
              </CategoryButton>
            );
          })}
        </Column>

        <Column title="2. Alt kategori" subtitle={form.category || 'Önce ana kategori seç'}>
          {subcategories.map((subcategoryName, index) => {
            const active = form.subcategory === subcategoryName;

            return (
              <CategoryButton key={subcategoryName} active={active} onClick={() => chooseSubcategory(subcategoryName)}>
                <span className="truncate font-black">{subcategoryName}</span>
                <span className={active ? 'text-white/75' : 'text-slate-400'}>{countLabel(index, 28)}</span>
              </CategoryButton>
            );
          })}
        </Column>

        <Column title="3. Marka / Tür" subtitle={brands.length ? 'Seçime göre filtre' : 'Bu kategori için opsiyonel'}>
          {brands.length ? brands.map((brandName, index) => {
            const active = selectedBrand === brandName;

            return (
              <CategoryButton key={brandName} active={active} onClick={() => chooseBrand(brandName)}>
                <span className="truncate font-black">{brandName}</span>
                <span className={active ? 'text-white/75' : 'text-slate-400'}>{countLabel(index, 21)}</span>
              </CategoryButton>
            );
          }) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
              Bu kategoride marka seçimi zorunlu değil. Sonraki adıma geçebilirsin.
            </div>
          )}
        </Column>

        <Column title="4. Model / Detay" subtitle={selectedBrand || 'Önce marka seç'}>
          {selectedBrand ? models.map((modelName, index) => {
            const active = selectedModel === modelName;

            return (
              <CategoryButton key={modelName} active={active} onClick={() => chooseModel(modelName)}>
                <span className="truncate font-black">{modelName}</span>
                <span className={active ? 'text-white/75' : 'text-slate-400'}>{countLabel(index, 14)}</span>
              </CategoryButton>
            );
          }) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
              Marka seçtiğinde model listesi burada açılır.
            </div>
          )}
        </Column>

        <aside className="rounded-[1.35rem] bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <CategoryIcon size={22} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-white/50">Canlı kategori özeti</div>
              <div className="text-xl font-black">{form.category}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <span className="text-white/55">Alt kategori</span>
              <b>{form.subcategory || '-'}</b>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <span className="text-white/55">Marka</span>
              <b>{selectedBrand || '-'}</b>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <span className="text-white/55">Model</span>
              <b>{selectedModel || '-'}</b>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/8 p-4 text-xs leading-5 text-white/70">
            Bu yapı kullanıcıyı tek dropdown içinde kaybettirmez. Her seçim yeni bir kolon açar ve ilan formu buna göre şekillenir.
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-400/15 px-3 py-2 text-xs font-black text-emerald-200">
            <CheckCircle2 size={15} />
            Marketplace kategori akışı aktif
          </div>
        </aside>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
        <Search size={16} />
        Sonraki adımda bu kategoriye uygun zorunlu alanlar ve kalite skoru otomatik güncellenecek.
      </div>
    </section>
  );
}
