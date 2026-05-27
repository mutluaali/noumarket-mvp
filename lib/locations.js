export const NEW_CALEDONIA_LOCATION_TREE = [
  { city: 'Nouméa', popularity: 100, districts: ['Centre-ville', 'Quartier Latin', 'Vallée du Génie', 'Artillerie', 'Orphelinat', 'Receiving', 'Motor Pool', 'Trianon', 'Faubourg Blanchot', 'Vallée des Colons', 'Magenta', 'Tina', 'Ducos', 'Ducos Le Centre', 'Logicoop', 'Kaméré', 'Montravel', 'Rivière Salée', 'PK4', 'PK6', 'PK7', 'Portes de Fer', 'Normandie', 'Sainte-Marie', 'Ouémo', 'Anse Vata', 'Baie des Citrons', 'Val Plaisance', "N'Géa", 'Nouville'] },
  { city: 'Dumbéa', popularity: 95, districts: ['Koutio', 'Auteuil', 'Dumbéa-sur-Mer', 'Nakutakoin', 'Katiramona', 'Plaine Adam', 'Val Suzon', 'Dumbéa Centre'] },
  { city: 'Mont-Dore', popularity: 90, districts: ['Boulari', 'Robinson', 'Yahoué', 'Pont-des-Français', 'Saint-Michel', 'La Coulée', 'Plum', 'Mouirange', 'Prony', 'Vallon-Dore'] },
  { city: 'Païta', popularity: 86, districts: ['Centre', 'Savannah', 'Val Boisé', 'Ondémia', 'Tontouta', 'Karikaté', 'Gadji', 'Naniouni'] },
  { city: 'Bourail', popularity: 76, districts: ['Centre', 'Roche Percée', 'Poé', 'Nessadiou', 'Gouaro', 'Nandaï'] },
  { city: 'Koné', popularity: 74, districts: ['Centre', 'Foué', 'Baco', 'Tiaoué', 'Koniambo'] },
  { city: 'La Foa', popularity: 70, districts: ['Centre', 'Fonwhary', 'Oua Tom', 'Oui-Poin'] },
  { city: 'Koumac', popularity: 66, districts: ['Centre', 'Néhoué', 'Paagoumène'] },
  { city: 'Poindimié', popularity: 64, districts: ['Centre', 'Tibarama', 'Wagap'] },
  { city: 'Lifou', popularity: 62, districts: ['Wé', 'Xépénéhé', 'Chépénéhé', 'Jozip', 'Hnathalo'] },
  { city: 'Maré', popularity: 58, districts: ['Tadine', 'La Roche', 'Wabao', 'Roh'] },
  { city: 'Ouvéa', popularity: 56, districts: ['Fayaoué', 'Mouli', 'Saint-Joseph'] },
  { city: 'Île des Pins', popularity: 54, districts: ['Vao', 'Kuto', 'Oro', 'Gadji'] },
  { city: 'Boulouparis', popularity: 52, districts: ['Centre', 'Bouraké', 'Port Ouenghi', 'Tomos'] },
  { city: 'Pouembout', popularity: 50, districts: ['Centre', 'Tipenga'] },
  { city: 'Poya', popularity: 48, districts: ['Centre', 'Népoui', 'Nétéa'] },
  { city: 'Voh', popularity: 46, districts: ['Centre', 'Gatope', 'Oundjo'] },
  { city: 'Canala', popularity: 44, districts: ['Centre', 'Nakety', 'Négropo'] },
  { city: 'Thio', popularity: 42, districts: ['Centre', 'Thio Mission', 'Thio Village'] },
  { city: 'Yaté', popularity: 40, districts: ['Centre', 'Touaourou', 'Goro', 'Waho'] },
  { city: 'Houaïlou', popularity: 38, districts: ['Centre', 'Poro', 'Néaoua'] },
  { city: 'Touho', popularity: 36, districts: ['Centre', 'Témala'] },
  { city: 'Hienghène', popularity: 34, districts: ['Centre', 'Lindéralique'] },
  { city: 'Kaala-Gomen', popularity: 32, districts: ['Centre', 'Ouaco'] },
  { city: 'Poum', popularity: 30, districts: ['Centre', 'Arama'] },
  { city: 'Bélep', popularity: 28, districts: ['Waala'] },
  { city: 'Farino', popularity: 26, districts: ['Centre'] },
  { city: 'Sarraméa', popularity: 24, districts: ['Centre'] },
  { city: 'Moindou', popularity: 22, districts: ['Centre', 'Moméa'] },
].sort((a, b) => b.popularity - a.popularity || a.city.localeCompare(b.city));

export const CITY_OPTIONS = NEW_CALEDONIA_LOCATION_TREE.map((item) => item.city);
export const LOCATION_OPTIONS = ['Tümü', ...CITY_OPTIONS];
export const NEW_CALEDONIA_LOCATIONS = Object.fromEntries(
  NEW_CALEDONIA_LOCATION_TREE.map((item) => [item.city, item.districts])
);

export function getDistrictsForCity(city) {
  return NEW_CALEDONIA_LOCATION_TREE.find((item) => item.city === city)?.districts || [];
}

export function buildLocationLabel(city, district = '') {
  if (!city || city === 'Tümü') return 'Tümü';
  return district ? `${city}, ${district}` : city;
}

export function splitLocationLabel(value = 'Tümü') {
  if (!value || value === 'Tümü') return { city: 'Tümü', district: '' };
  const [city, ...rest] = String(value).split(',').map((item) => item.trim()).filter(Boolean);
  return { city: city || 'Tümü', district: rest.join(', ') };
}
