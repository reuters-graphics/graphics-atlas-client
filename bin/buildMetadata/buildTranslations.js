const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const parseCSV = require('csv-parse/lib/sync');

const DATA_DIR = path.join(__dirname, '../../data/');
const enMetadataFile = fs.readFileSync(path.join(DATA_DIR, 'base_metadata.csv'), 'utf-8');
const enMetadata = parseCSV(enMetadataFile, { columns: true, skip_empty_lines: true });
const nameOverridesFile = fs.readFileSync(
  path.join(DATA_DIR, 'translations/country_name_overrides.csv'), 'utf-8');
const nameOverrides = parseCSV(nameOverridesFile, { columns: true, skip_empty_lines: true });

const checkENOverrides = (isoAlpha2, locale, value) => {
  if (locale !== 'en') return value;
  const country = enMetadata.find(d => d.iso_alpha_2 === isoAlpha2);
  if (!country) return value;
  return country.name;
};

const checkCustomOverrides = (isoAlpha2, locale, value) => {
  const country = nameOverrides.find(d => (d.isoAlpha2 === isoAlpha2) && (d.locale === locale));
  if (!country) return value;
  return country.name;
};

const checkOverrides = (isoAlpha2, locale, value) => {
  // Basically, checkENOverrides => checkCustomOverrides
  return checkCustomOverrides(isoAlpha2, locale, checkENOverrides(isoAlpha2, locale, value));
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
  const translations = {};
  for (const locale of locales) {
    const countries = await fetchCSV(locale);
    countries.forEach(({ id, value }) => {
      if (!(id in translations)) {
        translations[id] = {};
      }
      translations[id][locale] = checkOverrides(id, locale, value);
    });
  }
  return translations;
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
