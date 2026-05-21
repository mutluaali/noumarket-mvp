import tr from '@/locales/tr.json';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

const dictionaries = { tr, fr, en };

export function getDictionary(locale = 'fr') {
  return dictionaries[locale] || dictionaries.fr;
}

export function t(locale, key) {
  const dict = getDictionary(locale);
  return key.split('.').reduce((obj, part) => obj?.[part], dict) || key;
}
