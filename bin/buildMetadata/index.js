const path = require('path');
const fs = require('fs');
const parseCSV = require('csv-parse/sync').parse;
const buildTranslations = require('./buildTranslations');
const buildAbbreviations = require('./buildAbbreviations');
const slugify = require('@sindresorhus/slugify');
const fetchPopulation = require('./fetchPopulation');
const getCustomPopulation = require('./utils/getCustomPopulation');

const customPopulation = getCustomPopulation();

// Pick the most recent year that has (near-)complete coverage across the World
// Bank population rows, so the whole dataset shares one current year instead of
// a hardcoded one. Falls back to the latest year present if none is "complete".
const getLatestPopulationYear = (rows) => {
  const yearCols = Object.keys(rows[0] || {}).filter(k => /^\d{4}$/.test(k));
  if (!yearCols.length) return null;
  const count = y => rows.reduce((n, r) => n + (r[y] !== '' && r[y] != null ? 1 : 0), 0);
  const maxCount = Math.max(...yearCols.map(count));
  const complete = yearCols.filter(y => count(y) >= maxCount * 0.98);
  return (complete.length ? complete : yearCols).sort().pop();
};

const DATA_DIR = path.join(__dirname, '../../data/');
const unRegionsFile = fs.readFileSync(path.join(DATA_DIR, 'translations/un_region.csv'), 'utf-8');
const unRegionTranslations = parseCSV(unRegionsFile, { columns: true, skip_empty_lines: true });
const worldBankFile = fs.readFileSync(path.join(DATA_DIR, 'world-bank-classification.csv'), 'utf-8');
const worldBankData = parseCSV(worldBankFile, { columns: true, skip_empty_lines: true });

// Manually-editable country centroids (data/centroids.csv). Stored as
// coordinates: [longitude, latitude] (GeoJSON order) on each country.
const centroidsFile = fs.readFileSync(path.join(DATA_DIR, 'centroids.csv'), 'utf-8');
const centroidsData = parseCSV(centroidsFile, { columns: true, skip_empty_lines: true });
const getCoordinates = (d) => {
  const row = centroidsData.find(c => c.isoAlpha3 === d.iso_alpha_3);
  if (!row || row.latitude === '' || row.longitude === '') return null;
  return [Number(row.longitude), Number(row.latitude)];
};

// const unSubregionsFile = fs.readFileSync(path.join(DATA_DIR, 'translations/un_subregion.csv'), 'utf-8');
// const unSubregionTranslations = parseCSV(unSubregionsFile, { columns: true, skip_empty_lines: true });

const getRegionTranslations = (enName) => unRegionTranslations.find(d => d.en === enName) || {};
// const getSubregionTranslations = (enName) => unSubregionTranslations.find(d => d.en === enName) || {};

const createMetadata = async() => {
  const population = await fetchPopulation();
  const POPULATION_YEAR = getLatestPopulationYear(population);

  const metadataPath = path.join(DATA_DIR, 'base_metadata.csv');
  const metadataFile = fs.readFileSync(metadataPath, 'utf-8');

  const metadata = parseCSV(metadataFile, {
    columns: true,
    skip_empty_lines: true,
  });

  const translations = await buildTranslations();
  const abbreviations = await buildAbbreviations();

  const getPopulation = (d) => {
    const customPop = customPopulation.find(p => p.isoAlpha3 === d.iso_alpha_3);

    if (customPop) {
      return {
        d: parseInt(customPop.population),
        year: customPop.year,
        source: customPop.source_name,
      };
    }

    const pop = population.find(p => p['Country Code'] === d.iso_alpha_3);

    // if (!pop) console.log(`No pop for: ${d.name}`);

    return pop ? {
      d: parseInt(pop[POPULATION_YEAR]),
      year: POPULATION_YEAR,
      source: 'World Bank',
    } : null;
  };

  const getIncomeCategory = (d) => {
    const income = worldBankData.find(p => p.Code === d.iso_alpha_3);
    // if (!pop) console.log(`No pop for: ${d.name}`);
    return income ? {
      IncomeGroup: income['Income group'],
      LendingCategory: income['Lending category'],
      source: 'World Bank',
    } : null;
  };

  const codesData = metadata.map(d => ({
    isoAlpha2: d.iso_alpha_2,
    isoAlpha3: d.iso_alpha_3,
    isoNumeric: d.iso_numeric,
    name: d.name,
    slug: slugify(d.name),
    translations: translations[d.iso_alpha_2],
    abbreviations: abbreviations[d.iso_alpha_2],
    coordinates: getCoordinates(d),
    unRegion: d.un_region === '' ? null : {
      name: d.un_region,
      slug: slugify(d.un_region),
      translations: getRegionTranslations(d.un_region),
    },
    unSubregion: d.un_subregion === '' ? null : {
      name: d.un_subregion,
      slug: slugify(d.un_subregion),
      // translations: getSubregionTranslations(d.un_subregion),
    },
    dataProfile: {
      population: getPopulation(d),
      income: getIncomeCategory(d),
    },
    // worldBankRegion: {
    //   name: d.world_bank_region === '' ? null : d.world_bank_region,
    //   slug: d.world_bank_region === '' ? null : slugify(d.world_bank_region),
    // },
  }));

  fs.writeFileSync(
    path.resolve(__dirname, '../../lib/data/metadata.json'),
    JSON.stringify(codesData, null, 2)
  );
};

createMetadata();
