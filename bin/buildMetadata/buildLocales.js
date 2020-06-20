const fetch = require('node-fetch');
const parseCSV = require('csv-parse/lib/sync');

const fetchCSV = async(locale) => {
  const res = await fetch(`https://raw.githubusercontent.com/umpirsky/country-list/master/data/${locale}/country.csv`);
  const csv = await res.text();
  const codes = parseCSV(csv, {
    columns: true,
    skip_empty_lines: true,
  });
  return codes;
};

const buildLocales = async(locales) => {
  const translations = {};
  for (const locale of locales) {
    const countries = await fetchCSV(locale);
    countries.forEach(({ id, value }) => {
      if (!(id in translations)) {
        translations[id] = {};
      }
      translations[id][locale] = value;
    });
  }
  return translations;
};

module.exports = async() => {
  const locales = [
    'de', // German
    'en', // English
    'es', // Spanish
    'fa', // Persian
    'fr', // French
    'it', // Italian
    'ja', // Japanese
    'zh', // Chinese
  ];
  return buildLocales(locales);
};
