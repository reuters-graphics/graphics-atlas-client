const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const parseCSV = require('csv-parse/lib/sync');

const DATA_DIR = path.join(__dirname, '../../data/');
const abbreviationsFile = fs.readFileSync(
  path.join(DATA_DIR, 'translations/abbreviations.csv'), 'utf-8');
const abbreviations = parseCSV(abbreviationsFile, { columns: true, skip_empty_lines: true });

const checkForAbbreviation = (isoAlpha2, locale) => {
  const abbreviation = abbreviations.find(d => (d.isoAlpha2 === isoAlpha2) && (d.locale === locale));
  return abbreviation ? abbreviation.abbreviation : null;
};

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
  const abbreviations = {};
  for (const locale of locales) {
    const countries = await fetchCSV(locale);
    countries.forEach(({ id, value }) => {
      if (!(id in abbreviations)) {
        abbreviations[id] = {};
      }
      const abbreviation = checkForAbbreviation(id, locale);
      if (abbreviation) abbreviations[id][locale] = abbreviation;
    });
  }
  return abbreviations;
};

module.exports = async() => {
  const locales = [
    'de', // German
    'en', // English
    'es', // Spanish
    'pt', // Portuguese
    'fa', // Persian
    'fr', // French
    'it', // Italian
    'ja', // Japanese
    'zh', // Chinese
  ];
  return buildLocales(locales);
};
