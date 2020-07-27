const path = require('path');
const fs = require('fs');
const parseCSV = require('csv-parse/lib/sync');
const buildLocales = require('./buildLocales');
const slugify = require('@sindresorhus/slugify');
const fetchPopulation = require('./fetchPopulation');
const getCustomPopulation = require('./utils/getCustomPopulation');

const customPopulation = getCustomPopulation();

const POPULATION_YEAR = '2019';

const DATA_DIR = path.join(__dirname, '../../data/');
const unRegionsFile = fs.readFileSync(path.join(DATA_DIR, 'translations/un_region.csv'), 'utf-8');
const unRegionTranslations = parseCSV(unRegionsFile, { columns: true, skip_empty_lines: true });
// const unSubregionsFile = fs.readFileSync(path.join(DATA_DIR, 'translations/un_subregion.csv'), 'utf-8');
// const unSubregionTranslations = parseCSV(unSubregionsFile, { columns: true, skip_empty_lines: true });

const getRegionTranslations = (enName) => unRegionTranslations.find(d => d.en === enName) || {};
// const getSubregionTranslations = (enName) => unSubregionTranslations.find(d => d.en === enName) || {};

const createMetadata = async() => {
  const population = await fetchPopulation();

  const metadataPath = path.join(DATA_DIR, 'base_metadata.csv');
  const metadataFile = fs.readFileSync(metadataPath, 'utf-8');

  const metadata = parseCSV(metadataFile, {
    columns: true,
    skip_empty_lines: true,
  });

  const locales = await buildLocales();

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

  const codesData = metadata.map(d => ({
    isoAlpha2: d.iso_alpha_2,
    isoAlpha3: d.iso_alpha_3,
    isoNumeric: d.iso_numeric,
    name: d.name,
    slug: slugify(d.name),
    translations: locales[d.iso_alpha_2],
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
    },
    // worldBankRegion: {
    //   name: d.world_bank_region === '' ? null : d.world_bank_region,
    //   slug: d.world_bank_region === '' ? null : slugify(d.world_bank_region),
    // },
  }));

  fs.writeFileSync(
    path.resolve(__dirname, '../../lib/data/metadata.json'),
    JSON.stringify(codesData)
  );
};

createMetadata();
