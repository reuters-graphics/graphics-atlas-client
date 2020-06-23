const path = require('path');
const fs = require('fs');
const parseCSV = require('csv-parse/lib/sync');
const buildLocales = require('./buildLocales');
const slugify = require('@sindresorhus/slugify');

const createMetadata = async() => {
  const metadataPath = path.join(__dirname, '../../data/base_metadata.csv');
  const metadataFile = fs.readFileSync(metadataPath, 'utf-8');

  const metadata = parseCSV(metadataFile, {
    columns: true,
    skip_empty_lines: true,
  });

  const locales = await buildLocales();

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
    },
    unSubregion: d.un_subregion === '' ? null : {
      name: d.un_subregion,
      slug: slugify(d.un_subregion),
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
