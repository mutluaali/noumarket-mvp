const carFields = ['model', 'year', 'mileage', 'fuelType', 'transmission'];
const vehicleBrandFields = ['model', 'year', 'mileage', 'fuelType', 'transmission'];

function withOtherOption(options = []) {
  return Array.from(new Set([...options, 'Diğer']));
}

export const VEHICLE_MODELS = {
  'car-abarth': ['124 Spider', '500', '500C', '595', '695'],
  'car-alfa-romeo': ['147', '156', '159', 'Giulia', 'Giulietta', 'MiTo', 'Stelvio', 'Tonale'],
  'car-audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'RS3', 'RS4', 'RS6', 'TT'],
  'car-bmw': ['1 Serisi', '2 Serisi', '3 Serisi', '4 Serisi', '5 Serisi', '7 Serisi', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'i3', 'i4', 'iX', 'Z4'],
  'car-byd': ['Atto 3', 'Dolphin', 'Han', 'Seal', 'Seal U', 'Tang'],
  'car-chevrolet': ['Aveo', 'Camaro', 'Captiva', 'Colorado', 'Corvette', 'Cruze', 'Spark', 'Trax'],
  'car-citroen': ['Berlingo', 'C1', 'C2', 'C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C5 Aircross', 'DS3', 'Jumpy'],
  'car-cupra': ['Ateca', 'Born', 'Formentor', 'Leon'],
  'car-dacia': ['Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Sandero', 'Spring'],
  'car-daihatsu': ['Applause', 'Charade', 'Copen', 'Materia', 'Sirion', 'Terios'],
  'car-dodge': ['Caliber', 'Challenger', 'Charger', 'Durango', 'Journey', 'Ram'],
  'car-fiat': ['500', '500L', '500X', 'Bravo', 'Doblo', 'Ducato', 'Fiorino', 'Panda', 'Punto', 'Tipo'],
  'car-ford': ['Bronco', 'EcoSport', 'Everest', 'Fiesta', 'Focus', 'Kuga', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'Transit'],
  'car-geely': ['Coolray', 'Geometry C', 'Okavango', 'Tugella'],
  'car-great-wall': ['Cannon', 'Haval H6', 'Ora', 'Poer', 'Wingle'],
  'car-haval': ['H2', 'H6', 'H9', 'Jolion'],
  'car-holden': ['Astra', 'Barina', 'Colorado', 'Commodore', 'Captiva', 'Trax'],
  'car-honda': ['Accord', 'City', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Jazz', 'Odyssey', 'Pilot'],
  'car-hyundai': ['Accent', 'Creta', 'Elantra', 'Getz', 'H-1', 'i10', 'i20', 'i30', 'Ioniq', 'Kona', 'Santa Fe', 'Staria', 'Tucson'],
  'car-isuzu': ['D-Max', 'MU-X', 'N-Series'],
  'car-jaguar': ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'XE', 'XF', 'XJ'],
  'car-jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  'car-kia': ['Carnival', 'Ceed', 'Cerato', 'Niro', 'Picanto', 'Rio', 'Seltos', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic'],
  'car-land-rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  'car-lexus': ['CT', 'ES', 'GS', 'IS', 'LBX', 'NX', 'RX', 'UX'],
  'car-mazda': ['BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'Mazda 2', 'Mazda 3', 'Mazda 6', 'MX-5'],
  'car-mercedes': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'Sprinter', 'Viano', 'Vito'],
  'car-mg': ['HS', 'Marvel R', 'MG3', 'MG4', 'MG5', 'ZS', 'ZS EV'],
  'car-mini': ['Clubman', 'Cooper', 'Countryman', 'Paceman'],
  'car-mitsubishi': ['ASX', 'Eclipse Cross', 'L200', 'Lancer', 'Mirage', 'Outlander', 'Pajero', 'Pajero Sport', 'Triton'],
  'car-nissan': ['350Z', '370Z', 'Almera', 'Ariya', 'Juke', 'Leaf', 'Micra', 'Murano', 'Navara', 'Note', 'Pathfinder', 'Patrol', 'Qashqai', 'Skyline', 'X-Trail'],
  'car-opel': ['Astra', 'Combo', 'Corsa', 'Crossland', 'Grandland', 'Insignia', 'Mokka', 'Vivaro', 'Zafira'],
  'car-peugeot': ['106', '206', '207', '208', '2008', '3008', '301', '307', '308', '407', '508', '5008', 'Expert', 'Partner', 'Rifter'],
  'car-porsche': ['911', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
  'car-renault': ['Arkana', 'Captur', 'Clio', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna', 'Master', 'Megane', 'Scenic', 'Talisman', 'Trafic', 'Twingo', 'Zoe'],
  'car-seat': ['Arona', 'Ateca', 'Ibiza', 'Leon', 'Tarraco'],
  'car-skoda': ['Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Scala', 'Superb'],
  'car-smart': ['Forfour', 'Fortwo', 'Roadster'],
  'car-subaru': ['BRZ', 'Forester', 'Impreza', 'Legacy', 'Levorg', 'Outback', 'Tribeca', 'WRX', 'XV'],
  'car-suzuki': ['Alto', 'Baleno', 'Celerio', 'Grand Vitara', 'Ignis', 'Jimny', 'S-Cross', 'Swift', 'Vitara'],
  'car-tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'car-toyota': ['86', 'Aygo', 'C-HR', 'Camry', 'Corolla', 'Corolla Cross', 'Fortuner', 'Hiace', 'Hilux', 'Land Cruiser', 'Prado', 'Prius', 'RAV4', 'Starlet', 'Yaris', 'Yaris Cross'],
  'car-volkswagen': ['Amarok', 'Caddy', 'Crafter', 'Golf', 'Polo', 'Passat', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran', 'Transporter', 'Up'],
  'car-volvo': ['C30', 'S40', 'S60', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90'],
  'suv-toyota': ['Fortuner', 'Hilux', 'Land Cruiser', 'Prado', 'RAV4'],
  'suv-nissan': ['Navara', 'Pathfinder', 'Patrol', 'Qashqai', 'X-Trail'],
  'suv-mitsubishi': ['ASX', 'L200', 'Outlander', 'Pajero', 'Pajero Sport', 'Triton'],
  'suv-ford': ['Bronco', 'Everest', 'Kuga', 'Ranger'],
  'suv-jeep': ['Cherokee', 'Compass', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  'suv-land-rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport'],
  'suv-isuzu': ['D-Max', 'MU-X'],
  'suv-chevrolet': ['Blazer', 'Captiva', 'Colorado', 'Silverado', 'Suburban', 'Tahoe', 'Trailblazer'],
  'suv-dodge': ['Durango', 'Journey', 'Ram 1500'],
  'suv-great-wall': ['Cannon', 'Haval H6', 'Poer', 'Tank 300', 'Wingle'],
  'suv-honda': ['CR-V', 'HR-V', 'Passport', 'Pilot', 'Ridgeline'],
  'suv-hyundai': ['Creta', 'Kona', 'Palisade', 'Santa Fe', 'Tucson'],
  'suv-kia': ['Seltos', 'Sorento', 'Sportage', 'Telluride'],
  'suv-mazda': ['BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-9'],
  'suv-mercedes': ['Classe G', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'X-Class'],
  'suv-peugeot': ['2008', '3008', '4008', '5008', 'Landtrek'],
  'suv-renault': ['Arkana', 'Austral', 'Captur', 'Koleos'],
  'suv-subaru': ['Forester', 'Outback', 'XV'],
  'suv-suzuki': ['Grand Vitara', 'Jimny', 'S-Cross', 'Vitara'],
  'suv-volkswagen': ['Amarok', 'T-Cross', 'T-Roc', 'Taos', 'Tiguan', 'Touareg'],
  'suv-volvo': ['XC40', 'XC60', 'XC90'],
  'ev-tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'ev-byd': ['Atto 3', 'Dolphin', 'Han', 'Seal', 'Tang'],
  'ev-mg': ['MG4', 'Marvel R', 'ZS EV'],
  'ev-nissan': ['Ariya', 'Leaf'],
  'moto-aprilia': ['RS 125', 'RS 660', 'RSV4', 'SR GT', 'Tuareg 660', 'Tuono 660', 'Tuono V4'],
  'moto-bmw': ['C 400 GT', 'F 750 GS', 'F 850 GS', 'G 310 GS', 'G 310 R', 'R 1250 GS', 'R 1250 RT', 'S 1000 R', 'S 1000 RR'],
  'moto-cfmoto': ['250NK', '300NK', '450MT', '650MT', '700CL-X', '800MT'],
  'moto-ducati': ['Diavel', 'Hypermotard', 'Monster', 'Multistrada', 'Panigale', 'Scrambler', 'Streetfighter'],
  'moto-harley': ['Fat Bob', 'Fat Boy', 'Iron 883', 'Nightster', 'Road Glide', 'Sportster', 'Street Bob', 'Street Glide'],
  'moto-honda': ['Africa Twin', 'CB125F', 'CB500F', 'CB500X', 'CB650R', 'CBR500R', 'CBR650R', 'Forza 125', 'Forza 350', 'Gold Wing', 'PCX', 'SH125i', 'X-ADV'],
  'moto-husqvarna': ['701 Enduro', '701 Supermoto', 'Norden 901', 'Svartpilen 401', 'Vitpilen 401'],
  'moto-indian': ['Chief', 'Chieftain', 'FTR', 'Roadmaster', 'Scout'],
  'moto-kawasaki': ['ER-6N', 'KLR650', 'Ninja 300', 'Ninja 400', 'Ninja 650', 'Versys 650', 'Vulcan S', 'Z300', 'Z400', 'Z650', 'Z900', 'ZX-6R'],
  'moto-ktm': ['125 Duke', '250 Duke', '390 Adventure', '390 Duke', '690 SMC R', '790 Adventure', '890 Adventure', '1290 Super Adventure'],
  'moto-kymco': ['AK 550', 'Agility', 'Downtown 350', 'Like', 'People S', 'Xciting'],
  'moto-piaggio': ['Beverly', 'Liberty', 'Medley', 'MP3', 'Typhoon'],
  'moto-royal-enfield': ['Classic 350', 'Continental GT', 'Himalayan', 'Hunter 350', 'Interceptor 650', 'Meteor 350'],
  'moto-suzuki': ['Burgman 400', 'DR-Z400', 'GSX-R600', 'GSX-R750', 'GSX-S750', 'SV650', 'V-Strom 650', 'V-Strom 1050'],
  'moto-sym': ['Cruisym', 'Fiddle', 'Jet', 'Joymax', 'Maxsym'],
  'moto-triumph': ['Bonneville', 'Rocket 3', 'Scrambler', 'Speed Triple', 'Street Triple', 'Tiger 900', 'Tiger 1200', 'Trident 660'],
  'moto-vespa': ['GTS 300', 'Primavera', 'Sprint'],
  'moto-yamaha': ['Aerox', 'Crypton', 'Fazer', 'FJR1300', 'MT-03', 'MT-07', 'MT-09', 'NMAX', 'R3', 'R6', 'R7', 'TMAX', 'Tenere 700', 'Tracer 7', 'Tracer 9', 'XMAX', 'YZF-R1'],
  'moto-benelli': ['125 S', '302S', '502C', 'TRK 502', 'Leoncino 500'],
  'moto-beta': ['RR 125', 'RR 300', 'RR 350', 'RR 390', 'RR 430', 'XTrainer'],
  'moto-brixton': ['Cromwell 125', 'Crossfire 500', 'Felsberg 125', 'Rayburn 125'],
  'moto-moto-guzzi': ['V7', 'V85 TT', 'V9', 'California'],
  'moto-mv-agusta': ['Brutale', 'Dragster', 'F3', 'Turismo Veloce'],
  'moto-segway': ['Snarler', 'Fugleman', 'Villain'],
  'moto-niu': ['MQi', 'NQi', 'UQi', 'RQi'],
  'commercial-fiat': ['Doblo Cargo', 'Ducato', 'Fiorino', 'Scudo'],
  'commercial-ford': ['Ranger', 'Transit', 'Transit Connect', 'Transit Custom'],
  'commercial-isuzu': ['D-Max', 'N-Series', 'F-Series'],
  'commercial-mercedes': ['Citan', 'Sprinter', 'Vito', 'V-Class', 'Actros', 'Atego'],
  'commercial-mitsubishi': ['L200', 'Triton', 'Canter'],
  'commercial-nissan': ['Cabstar', 'Interstar', 'Navara', 'NV200', 'Primastar'],
  'commercial-peugeot': ['Boxer', 'Expert', 'Partner', 'Traveller'],
  'commercial-renault': ['Kangoo', 'Master', 'Trafic'],
  'commercial-toyota': ['Hiace', 'Hilux', 'Proace'],
  'commercial-volkswagen': ['Amarok', 'Caddy', 'Crafter', 'Transporter'],
  'commercial-citroen': ['Berlingo', 'Jumper', 'Jumpy'],
  'commercial-dacia': ['Dokker', 'Duster Commercial', 'Logan Van'],
  'commercial-hyundai': ['H-1', 'H350', 'Staria Van'],
  'commercial-iveco': ['Daily', 'Eurocargo', 'S-Way'],
  'commercial-kia': ['Bongo', 'K2500', 'K2700'],
  'commercial-man': ['TGE', 'TGL', 'TGM', 'TGX'],
  'commercial-mazda': ['BT-50', 'Bongo', 'E-Series'],
  'commercial-opel': ['Combo', 'Movano', 'Vivaro'],
  'commercial-scania': ['P-Series', 'G-Series', 'R-Series'],
  'commercial-suzuki': ['Carry', 'Super Carry'],
  'commercial-volvo': ['FE', 'FH', 'FM'],
};

VEHICLE_MODELS['suv-pickup'] = Array.from(new Set([
  ...(VEHICLE_MODELS['suv-toyota'] || []),
  ...(VEHICLE_MODELS['suv-nissan'] || []),
  ...(VEHICLE_MODELS['suv-mitsubishi'] || []),
  ...(VEHICLE_MODELS['suv-ford'] || []),
  ...(VEHICLE_MODELS['suv-jeep'] || []),
  ...(VEHICLE_MODELS['suv-land-rover'] || []),
  ...(VEHICLE_MODELS['suv-isuzu'] || []),
  ...(VEHICLE_MODELS['suv-chevrolet'] || []),
  ...(VEHICLE_MODELS['suv-dodge'] || []),
  ...(VEHICLE_MODELS['suv-great-wall'] || []),
  ...(VEHICLE_MODELS['suv-honda'] || []),
  ...(VEHICLE_MODELS['suv-hyundai'] || []),
  ...(VEHICLE_MODELS['suv-kia'] || []),
  ...(VEHICLE_MODELS['suv-mazda'] || []),
  ...(VEHICLE_MODELS['suv-mercedes'] || []),
  ...(VEHICLE_MODELS['suv-peugeot'] || []),
  ...(VEHICLE_MODELS['suv-renault'] || []),
  ...(VEHICLE_MODELS['suv-subaru'] || []),
  ...(VEHICLE_MODELS['suv-suzuki'] || []),
  ...(VEHICLE_MODELS['suv-volkswagen'] || []),
  ...(VEHICLE_MODELS['suv-volvo'] || []),
]));

Object.keys(VEHICLE_MODELS).forEach((key) => {
  VEHICLE_MODELS[key] = withOtherOption(VEHICLE_MODELS[key]);
});

export const CATEGORY_TREE = [
  {
    id: 'real-estate', label: 'Emlak', icon: '🏠', count: 0,
    children: [
      { id: 'housing', label: 'Konut', count: 0, children: [
        { id: 'housing-sale', label: 'Satılık', count: 0, children: [
          { id: 'sale-apartment', label: 'Daire', count: 0, fields: ['rooms','areaM2','floor','heating','furnished'] },
          { id: 'sale-detached-house', label: 'Müstakil Ev', count: 0, fields: ['rooms','areaM2','floor','heating','furnished'] },
          { id: 'sale-farm-house', label: 'Çiftlik Evi', count: 0, fields: ['rooms','areaM2','heating','furnished'] },
          { id: 'sale-villa', label: 'Villa', count: 0, fields: ['rooms','areaM2','pool','furnished'] },
        ]},
        { id: 'housing-rent', label: 'Kiralık', count: 0, children: [
          { id: 'rent-apartment', label: 'Daire', count: 0, fields: ['rooms','areaM2','floor','deposit','heating','furnished'] },
          { id: 'rent-detached-house', label: 'Müstakil Ev', count: 0, fields: ['rooms','areaM2','deposit','heating','furnished'] },
          { id: 'rent-farm-house', label: 'Çiftlik Evi', count: 0, fields: ['rooms','areaM2','deposit','heating','furnished'] },
          { id: 'rent-villa', label: 'Villa', count: 0, fields: ['rooms','areaM2','deposit','pool','furnished'] },
        ]},
      ]},
      { id: 'workplace-real-estate', label: 'İşyeri', count: 0, children: [
        { id: 'workplace-sale', label: 'Satılık', count: 0, fields: ['areaM2','floor','usageType','furnished'] },
        { id: 'workplace-rent', label: 'Kiralık', count: 0, fields: ['areaM2','floor','deposit','usageType','furnished'] },
      ]},
      { id: 'land', label: 'Arsa', count: 0, children: [
        { id: 'land-sale', label: 'Satılık Arsa', count: 0, fields: ['areaM2','zoningStatus','roadAccess'] },
        { id: 'land-rent', label: 'Kiralık Arsa', count: 0, fields: ['areaM2','zoningStatus','roadAccess'] },
      ]},
    ],
  },
  {
    id: 'vehicles', label: 'Vasıta', icon: '🚗', count: 0,
    children: [
      { id: 'cars', label: 'Otomobil', count: 0, fields: ['brand', ...carFields], children: [
        { id: 'car-abarth', label: 'Abarth', count: 0, fields: vehicleBrandFields },
        { id: 'car-alfa-romeo', label: 'Alfa Romeo', count: 0, fields: vehicleBrandFields },
        { id: 'car-audi', label: 'Audi', count: 0, fields: vehicleBrandFields },
        { id: 'car-bmw', label: 'BMW', count: 0, fields: vehicleBrandFields },
        { id: 'car-byd', label: 'BYD', count: 0, fields: vehicleBrandFields },
        { id: 'car-chevrolet', label: 'Chevrolet', count: 0, fields: vehicleBrandFields },
        { id: 'car-citroen', label: 'Citroën', count: 0, fields: vehicleBrandFields },
        { id: 'car-cupra', label: 'Cupra', count: 0, fields: vehicleBrandFields },
        { id: 'car-dacia', label: 'Dacia', count: 0, fields: vehicleBrandFields },
        { id: 'car-daihatsu', label: 'Daihatsu', count: 0, fields: vehicleBrandFields },
        { id: 'car-dodge', label: 'Dodge', count: 0, fields: vehicleBrandFields },
        { id: 'car-fiat', label: 'Fiat', count: 0, fields: vehicleBrandFields },
        { id: 'car-ford', label: 'Ford', count: 0, fields: vehicleBrandFields },
        { id: 'car-geely', label: 'Geely', count: 0, fields: vehicleBrandFields },
        { id: 'car-great-wall', label: 'Great Wall', count: 0, fields: vehicleBrandFields },
        { id: 'car-haval', label: 'Haval', count: 0, fields: vehicleBrandFields },
        { id: 'car-holden', label: 'Holden', count: 0, fields: vehicleBrandFields },
        { id: 'car-honda', label: 'Honda', count: 0, fields: vehicleBrandFields },
        { id: 'car-hyundai', label: 'Hyundai', count: 0, fields: vehicleBrandFields },
        { id: 'car-isuzu', label: 'Isuzu', count: 0, fields: vehicleBrandFields },
        { id: 'car-jaguar', label: 'Jaguar', count: 0, fields: vehicleBrandFields },
        { id: 'car-jeep', label: 'Jeep', count: 0, fields: vehicleBrandFields },
        { id: 'car-kia', label: 'Kia', count: 0, fields: vehicleBrandFields },
        { id: 'car-land-rover', label: 'Land Rover', count: 0, fields: vehicleBrandFields },
        { id: 'car-lexus', label: 'Lexus', count: 0, fields: vehicleBrandFields },
        { id: 'car-mazda', label: 'Mazda', count: 0, fields: vehicleBrandFields },
        { id: 'car-mercedes', label: 'Mercedes-Benz', count: 0, fields: vehicleBrandFields },
        { id: 'car-mg', label: 'MG', count: 0, fields: vehicleBrandFields },
        { id: 'car-mini', label: 'Mini', count: 0, fields: vehicleBrandFields },
        { id: 'car-mitsubishi', label: 'Mitsubishi', count: 0, fields: vehicleBrandFields },
        { id: 'car-nissan', label: 'Nissan', count: 0, fields: vehicleBrandFields },
        { id: 'car-opel', label: 'Opel', count: 0, fields: vehicleBrandFields },
        { id: 'car-peugeot', label: 'Peugeot', count: 0, fields: vehicleBrandFields },
        { id: 'car-porsche', label: 'Porsche', count: 0, fields: vehicleBrandFields },
        { id: 'car-renault', label: 'Renault', count: 0, fields: vehicleBrandFields },
        { id: 'car-seat', label: 'Seat', count: 0, fields: vehicleBrandFields },
        { id: 'car-skoda', label: 'Skoda', count: 0, fields: vehicleBrandFields },
        { id: 'car-smart', label: 'Smart', count: 0, fields: vehicleBrandFields },
        { id: 'car-subaru', label: 'Subaru', count: 0, fields: vehicleBrandFields },
        { id: 'car-suzuki', label: 'Suzuki', count: 0, fields: vehicleBrandFields },
        { id: 'car-tesla', label: 'Tesla', count: 0, fields: vehicleBrandFields },
        { id: 'car-toyota', label: 'Toyota', count: 0, fields: vehicleBrandFields },
        { id: 'car-volkswagen', label: 'Volkswagen', count: 0, fields: vehicleBrandFields },
        { id: 'car-volvo', label: 'Volvo', count: 0, fields: vehicleBrandFields },
        { id: 'car-other', label: 'Diğer Marka', count: 0, fields: vehicleBrandFields },
      ]},
      { id: 'suv-pickup', label: 'Arazi, SUV & Pickup', count: 0, fields: ['brand', ...carFields], children: [
        { id: 'suv-toyota', label: 'Toyota', count: 0, fields: vehicleBrandFields },
        { id: 'suv-nissan', label: 'Nissan', count: 0, fields: vehicleBrandFields },
        { id: 'suv-mitsubishi', label: 'Mitsubishi', count: 0, fields: vehicleBrandFields },
        { id: 'suv-ford', label: 'Ford', count: 0, fields: vehicleBrandFields },
        { id: 'suv-jeep', label: 'Jeep', count: 0, fields: vehicleBrandFields },
        { id: 'suv-land-rover', label: 'Land Rover', count: 0, fields: vehicleBrandFields },
        { id: 'suv-isuzu', label: 'Isuzu', count: 0, fields: vehicleBrandFields },
        { id: 'suv-chevrolet', label: 'Chevrolet', count: 0, fields: vehicleBrandFields },
        { id: 'suv-dodge', label: 'Dodge / Ram', count: 0, fields: vehicleBrandFields },
        { id: 'suv-great-wall', label: 'Great Wall / Haval', count: 0, fields: vehicleBrandFields },
        { id: 'suv-honda', label: 'Honda', count: 0, fields: vehicleBrandFields },
        { id: 'suv-hyundai', label: 'Hyundai', count: 0, fields: vehicleBrandFields },
        { id: 'suv-kia', label: 'Kia', count: 0, fields: vehicleBrandFields },
        { id: 'suv-mazda', label: 'Mazda', count: 0, fields: vehicleBrandFields },
        { id: 'suv-mercedes', label: 'Mercedes-Benz', count: 0, fields: vehicleBrandFields },
        { id: 'suv-peugeot', label: 'Peugeot', count: 0, fields: vehicleBrandFields },
        { id: 'suv-renault', label: 'Renault', count: 0, fields: vehicleBrandFields },
        { id: 'suv-subaru', label: 'Subaru', count: 0, fields: vehicleBrandFields },
        { id: 'suv-suzuki', label: 'Suzuki', count: 0, fields: vehicleBrandFields },
        { id: 'suv-volkswagen', label: 'Volkswagen', count: 0, fields: vehicleBrandFields },
        { id: 'suv-volvo', label: 'Volvo', count: 0, fields: vehicleBrandFields },
        { id: 'suv-other', label: 'Diğer Marka', count: 0, fields: vehicleBrandFields },
      ]},
      { id: 'electric-vehicles', label: 'Elektrikli Araçlar', count: 0, fields: ['brand','model','year','mileage','rangeKm'], children: [
        { id: 'ev-tesla', label: 'Tesla', count: 0, fields: ['model','year','mileage','rangeKm'] },
        { id: 'ev-byd', label: 'BYD', count: 0, fields: ['model','year','mileage','rangeKm'] },
        { id: 'ev-mg', label: 'MG', count: 0, fields: ['model','year','mileage','rangeKm'] },
        { id: 'ev-nissan', label: 'Nissan', count: 0, fields: ['model','year','mileage','rangeKm'] },
        { id: 'ev-other', label: 'Diğer Marka', count: 0, fields: ['model','year','mileage','rangeKm'] },
      ]},
      { id: 'motorcycles', label: 'Motosiklet', count: 0, fields: ['brand','model','year','mileage'], children: [
        { id: 'moto-aprilia', label: 'Aprilia', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-bmw', label: 'BMW Motorrad', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-cfmoto', label: 'CFMOTO', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-ducati', label: 'Ducati', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-harley', label: 'Harley-Davidson', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-honda', label: 'Honda', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-husqvarna', label: 'Husqvarna', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-indian', label: 'Indian', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-kawasaki', label: 'Kawasaki', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-ktm', label: 'KTM', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-kymco', label: 'Kymco', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-piaggio', label: 'Piaggio', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-royal-enfield', label: 'Royal Enfield', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-suzuki', label: 'Suzuki', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-sym', label: 'SYM', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-triumph', label: 'Triumph', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-vespa', label: 'Vespa', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-yamaha', label: 'Yamaha', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-benelli', label: 'Benelli', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-beta', label: 'Beta', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-brixton', label: 'Brixton', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-moto-guzzi', label: 'Moto Guzzi', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-mv-agusta', label: 'MV Agusta', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-segway', label: 'Segway', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-niu', label: 'NIU', count: 0, fields: ['model','year','mileage'] },
        { id: 'moto-other', label: 'Diğer Marka', count: 0, fields: ['model','year','mileage'] },
      ]},
      { id: 'commercial', label: 'Ticari Araçlar', count: 0, fields: ['brand','model','year','mileage','fuelType'], children: [
        { id: 'commercial-fiat', label: 'Fiat', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-ford', label: 'Ford', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-isuzu', label: 'Isuzu', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-mercedes', label: 'Mercedes-Benz', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-mitsubishi', label: 'Mitsubishi', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-nissan', label: 'Nissan', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-peugeot', label: 'Peugeot', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-renault', label: 'Renault', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-toyota', label: 'Toyota', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-volkswagen', label: 'Volkswagen', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-citroen', label: 'Citroen', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-dacia', label: 'Dacia', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-hyundai', label: 'Hyundai', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-iveco', label: 'Iveco', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-kia', label: 'Kia', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-man', label: 'MAN', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-mazda', label: 'Mazda', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-opel', label: 'Opel', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-scania', label: 'Scania', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-suzuki', label: 'Suzuki', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-volvo', label: 'Volvo Trucks', count: 0, fields: vehicleBrandFields },
        { id: 'commercial-other', label: 'Diğer Marka', count: 0, fields: vehicleBrandFields },
      ]},
      { id: 'marine', label: 'Deniz Araçları', count: 0, fields: ['brand','model','year','engineHours'] },
    ],
  },
  { id: 'parts', label: 'Yedek Parça, Aksesuar, Donanım & Tuning', icon: '🛠️', count: 0, children: [
    { id: 'vehicle-parts', label: 'Otomotiv Ekipmanları', count: 0, fields: ['condition','brand'] },
    { id: 'motorcycle-parts', label: 'Motosiklet Ekipmanları', count: 0, fields: ['condition','brand'] },
    { id: 'marine-parts', label: 'Deniz Aracı Ekipmanları', count: 0, fields: ['condition','brand'] },
  ]},
  { id: 'technology', label: 'Teknoloji', icon: '📱', count: 0, children: [
    { id: 'phones', label: 'Telefon & Aksesuar', count: 0, fields: ['brand','model','condition','warranty'] },
    { id: 'computers', label: 'Bilgisayar', count: 0, fields: ['brand','model','condition','warranty'] },
    { id: 'tablets', label: 'Tablet', count: 0, fields: ['brand','model','condition','warranty'] },
    { id: 'photography', label: 'Fotoğraf & Kamera', count: 0, fields: ['brand','model','condition'] },
    { id: 'game-console', label: 'Oyun Konsolu & Oyun', count: 0, fields: ['brand','model','condition','warranty'] },
    { id: 'wearable-tech', label: 'Akıllı Saat & Giyilebilir', count: 0, fields: ['brand','model','condition','warranty'] },
    { id: 'electronics', label: 'Elektronik Ev Aletleri', count: 0, fields: ['brand','condition','warranty'] },
  ]},
  { id: 'furniture-home', label: 'Mobilya & Ev', icon: '🛋️', count: 0, children: [
    { id: 'living-room', label: 'Salon & Oturma Odası', count: 0, fields: ['condition','deliveryOption'] },
    { id: 'bedroom', label: 'Yatak Odası', count: 0, fields: ['condition','deliveryOption'] },
    { id: 'kitchen-furniture', label: 'Mutfak & Yemek Odası', count: 0, fields: ['condition','deliveryOption'] },
    { id: 'office-furniture', label: 'Ofis Mobilyası', count: 0, fields: ['condition','deliveryOption'] },
    { id: 'home-decoration', label: 'Ev Dekorasyon', count: 0, fields: ['condition','deliveryOption'] },
    { id: 'garden-furniture', label: 'Bahçe Mobilyası', count: 0, fields: ['condition','deliveryOption'] },
    { id: 'white-goods', label: 'Beyaz Eşya', count: 0, fields: ['brand','condition','warranty','deliveryOption'] },
  ]},
  { id: 'fashion', label: 'Giyim & Aksesuar', icon: '👕', count: 0, children: [
    { id: 'women-fashion', label: 'Kadın Giyim', count: 0, fields: ['condition','size'] },
    { id: 'men-fashion', label: 'Erkek Giyim', count: 0, fields: ['condition','size'] },
    { id: 'shoes', label: 'Ayakkabı', count: 0, fields: ['condition','size'] },
    { id: 'bags', label: 'Çanta', count: 0, fields: ['condition'] },
    { id: 'watches-jewelry', label: 'Saat & Takı', count: 0, fields: ['condition','brand'] },
    { id: 'baby-kids-fashion', label: 'Bebek & Çocuk Giyim', count: 0, fields: ['condition','size'] },
  ]},
  { id: 'hobby-sport', label: 'Spor, Hobi & Kitap', icon: '⚽', count: 0, children: [
    { id: 'sport', label: 'Spor & Outdoor', count: 0, fields: ['condition'] },
    { id: 'books', label: 'Kitap, Dergi & Film', count: 0, fields: ['condition'] },
    { id: 'music-instruments', label: 'Müzik Aletleri', count: 0, fields: ['brand','condition'] },
    { id: 'collectibles', label: 'Koleksiyon', count: 0, fields: ['condition'] },
  ]},
  { id: 'services', label: 'Hizmetler', icon: '💼', count: 0, children: [
    { id: 'repair', label: 'Tamir & Teknik Servis', count: 0, fields: ['usageType'] },
    { id: 'transport', label: 'Nakliye', count: 0, fields: ['usageType'] },
  ]},
  { id: 'jobs', label: 'İş İlanları', icon: '💼', count: 0, children: [
    { id: 'full-time', label: 'Tam Zamanlı', count: 0, fields: ['usageType'] },
    { id: 'part-time', label: 'Yarı Zamanlı', count: 0, fields: ['usageType'] },
  ]},
  { id: 'pets', label: 'Hayvanlar Alemi', icon: '🐾', count: 0, children: [
    { id: 'pet-accessories', label: 'Aksesuar', count: 0, fields: ['condition'] },
  ]},
  { id: 'garden', label: 'Tarım & Bahçe', icon: '🌿', count: 0, children: [
    { id: 'garden-tools', label: 'Bahçe & Yapı Market', count: 0, fields: ['condition'] },
  ]},
];

export const FIELD_DEFINITIONS = {
  brand: { label: 'Marka', type: 'text', placeholder: 'Önce kategori ağacından marka seçebilirsin...' },
  model: { label: 'Model', type: 'text', placeholder: 'Corolla, 208, Hilux...' },
  year: { label: 'Yıl', type: 'number', placeholder: '2018' },
  mileage: { label: 'Kilometre', type: 'number', placeholder: '85.000' },
  fuelType: { label: 'Yakıt', type: 'select', options: ['Benzin','Dizel','Hibrit','Elektrik'] },
  transmission: { label: 'Vites', type: 'select', options: ['Otomatik','Manuel','Yarı otomatik'] },
  engineHours: { label: 'Motor Saati', type: 'number', placeholder: '1.200' },
  rangeKm: { label: 'Menzil km', type: 'number', placeholder: '420' },
  rooms: { label: 'Oda Sayısı', type: 'select', options: ['F0','F1','F2','F3','F4','F5+'] },
  areaM2: { label: 'm²', type: 'number', placeholder: '120' },
  floor: { label: 'Kat', type: 'text', placeholder: '3 / 5' },
  deposit: { label: 'Depozito', type: 'number', placeholder: '50.000' },
  heating: { label: 'Isıtma', type: 'select', options: ['Yok','Klima','Kombi','Merkezi','Soba'] },
  furnished: { label: 'Eşyalı mı?', type: 'select', options: ['Evet','Hayır'] },
  pool: { label: 'Havuz', type: 'select', options: ['Var','Yok'] },
  zoningStatus: { label: 'İmar Durumu', type: 'select', options: ['Konut','Ticari','Tarla','Bağ & Bahçe','Bilinmiyor'] },
  roadAccess: { label: 'Yol Durumu', type: 'select', options: ['Asfalt','Stabilize','Toprak','Yol yok'] },
  usageType: { label: 'Kullanım Tipi', type: 'text', placeholder: 'Ofis, mağaza, servis...' },
  condition: { label: 'Durum', type: 'select', options: ['Sıfır','Yeni gibi','İyi','Kullanılmış','Hasarlı'] },
  warranty: { label: 'Garanti', type: 'select', options: ['Var','Yok','Bilinmiyor'] },
  deliveryOption: { label: 'Teslimat', type: 'select', options: ['Elden teslim','Kargo','Nakliye alıcıya ait','Satıcı teslim eder'] },
  size: { label: 'Beden / Ölçü', type: 'text', placeholder: 'M, L, 42, 120x200...' },
};

export function formatCount(value){
  if(value === undefined || value === null) return '0';
  return new Intl.NumberFormat('tr-TR').format(value);
}

export function findCategoryNode(id, nodes = CATEGORY_TREE, parents = []){
  for(const node of nodes){
    const path = [...parents, node];
    if(node.id === id) return { node, path };
    if(node.children){
      const found = findCategoryNode(id, node.children, path);
      if(found) return found;
    }
  }
  return null;
}

export function getDescendantCategoryIds(id){
  const found = findCategoryNode(id);
  if(!found) return [];
  const ids = [];
  function walk(node){
    ids.push(node.id);
    node.children?.forEach(walk);
  }
  walk(found.node);
  return ids;
}

export function buildCategoryLabel(categoryId, subcategoryId){
  const id = subcategoryId || categoryId;
  const found = findCategoryNode(id);
  return found ? found.path.map(x=>x.label).join(' > ') : '';
}

export function listingMatchesCategoryNode(listing, node){
  if(!listing || !node) return false;
  const ids = new Set(getDescendantCategoryIds(node.id));
  const listingCategoryId = listing.categoryId || listing.category_id;
  const listingSubcategoryId = listing.subcategoryId || listing.subcategory_id;
  if(ids.has(listingCategoryId) || ids.has(listingSubcategoryId)) return true;

  const labels = [];
  function collect(current){
    labels.push(String(current.label || '').toLowerCase());
    current.children?.forEach(collect);
  }
  collect(node);

  const text = [
    listing.category,
    listing.subcategory,
    listing.categoryLabel,
    listing.category_label,
    listing.brand,
    listing.model,
    listing.title,
  ].filter(Boolean).join(' ').toLowerCase();

  return labels.some((label) => label && text.includes(label));
}

export function calculateCategoryCounts(listings = []){
  const counts = {};
  function walk(node){
    const count = listings.filter((listing) => listingMatchesCategoryNode(listing, node)).length;
    counts[node.id] = count;
    node.children?.forEach(walk);
  }
  CATEGORY_TREE.forEach(walk);
  return counts;
}
