export const NEW_CALEDONIA_LOCATION_TREE = [
  { city: 'Noumea', popularity: 100, districts: ['Centre-ville', 'Quartier Latin', 'Vallee du Genie', 'Artillerie', 'Orphelinat', 'Receiving', 'Motor Pool', 'Trianon', 'Faubourg Blanchot', 'Vallee des Colons', 'Magenta', 'Tina', 'Ducos', 'Logicoop', 'Kamere', 'Montravel', 'Riviere Salee', 'PK4', 'PK6', 'PK7', 'Portes de Fer', 'Normandie', 'Sainte-Marie', 'Ouemo', 'Anse Vata', 'Baie des Citrons', 'Val Plaisance', "N'Gea", 'Nouville'] },
  { city: 'Dumbea', popularity: 95, districts: ['Koutio', 'Auteuil', 'Dumbea-sur-Mer', 'Nakutakoin', 'Katiramona', 'Plaine Adam', 'Val Suzon', 'Dumbea Centre'] },
  { city: 'Mont-Dore', popularity: 90, districts: ['Boulari', 'Robinson', 'Yahoue', 'Pont-des-Francais', 'Saint-Michel', 'La Coulee', 'Plum', 'Mouirange', 'Prony', 'Vallon-Dore'] },
  { city: 'Paita', popularity: 86, districts: ['Centre', 'Savannah', 'Val Boise', 'Ondemia', 'Tontouta', 'Karikate', 'Gadji', 'Naniouni'] },
  { city: 'Bourail', popularity: 76, districts: ['Centre', 'Roche Percee', 'Poe', 'Nessadiou', 'Gouaro', 'Nandai'] },
  { city: 'Kone', popularity: 74, districts: ['Centre', 'Foue', 'Baco', 'Tiaoue', 'Koniambo'] },
  { city: 'La Foa', popularity: 70, districts: ['Centre', 'Fonwhary', 'Oua Tom', 'Oui-Poin'] },
  { city: 'Koumac', popularity: 66, districts: ['Centre', 'Nehoue', 'Paagoumene'] },
  { city: 'Poindimie', popularity: 64, districts: ['Centre', 'Tibarama', 'Wagap'] },
  { city: 'Lifou', popularity: 62, districts: ['We', 'Xepenehe', 'Chepenehe', 'Jozip', 'Hnathalo'] },
  { city: 'Mare', popularity: 58, districts: ['Tadine', 'La Roche', 'Wabao', 'Roh'] },
  { city: 'Ouvea', popularity: 56, districts: ['Fayaoue', 'Mouli', 'Saint-Joseph'] },
  { city: 'Ile des Pins', popularity: 54, districts: ['Vao', 'Kuto', 'Oro', 'Gadji'] },
  { city: 'Boulouparis', popularity: 52, districts: ['Centre', 'Bourake', 'Port Ouenghi', 'Tomos'] },
  { city: 'Pouembout', popularity: 50, districts: ['Centre', 'Tipenga'] },
  { city: 'Poya', popularity: 48, districts: ['Centre', 'Nepoui', 'Netea'] },
  { city: 'Voh', popularity: 46, districts: ['Centre', 'Gatope', 'Oundjo'] },
  { city: 'Canala', popularity: 44, districts: ['Centre', 'Nakety', 'Negropo'] },
  { city: 'Thio', popularity: 42, districts: ['Centre', 'Thio Mission', 'Thio Village'] },
  { city: 'Yate', popularity: 40, districts: ['Centre', 'Touaourou', 'Goro', 'Waho'] },
  { city: 'Houailou', popularity: 38, districts: ['Centre', 'Poro', 'Neaoua'] },
  { city: 'Touho', popularity: 36, districts: ['Centre', 'Temala'] },
  { city: 'Hienghene', popularity: 34, districts: ['Centre', 'Linderalique'] },
  { city: 'Kaala-Gomen', popularity: 32, districts: ['Centre', 'Ouaco'] },
  { city: 'Poum', popularity: 30, districts: ['Centre', 'Arama'] },
  { city: 'Belep', popularity: 28, districts: ['Waala'] },
  { city: 'Farino', popularity: 26, districts: ['Centre'] },
  { city: 'Sarramea', popularity: 24, districts: ['Centre'] },
  { city: 'Moindou', popularity: 22, districts: ['Centre', 'Momea'] },
].sort((a, b) => b.popularity - a.popularity || a.city.localeCompare(b.city));

export const CITY_OPTIONS = NEW_CALEDONIA_LOCATION_TREE.map((item) => item.city);
export const LOCATION_OPTIONS = ['Tumu', ...CITY_OPTIONS];
export const NEW_CALEDONIA_LOCATIONS = Object.fromEntries(
  NEW_CALEDONIA_LOCATION_TREE.map((item) => [item.city, item.districts])
);

export function getDistrictsForCity(city) {
  return NEW_CALEDONIA_LOCATION_TREE.find((item) => item.city === city)?.districts || [];
}

export function buildLocationLabel(city, district = '') {
  if (!city || city === 'Tumu') return 'Tumu';
  return district ? `${city}, ${district}` : city;
}

export function splitLocationLabel(value = 'Tumu') {
  if (!value || value === 'Tumu') return { city: 'Tumu', district: '' };
  const [city, ...rest] = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  return { city: city || 'Tumu', district: rest.join(', ') };
}
