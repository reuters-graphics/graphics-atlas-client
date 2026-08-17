const fs = require('fs');
const path = require('path');
const { topology } = require('topojson-server');
const { quantize } = require('topojson-client');
const AtlasClient = require('../../dist/index.js');

const atlas = new AtlasClient();

const INPUT_DIR = path.resolve(__dirname, '../../input');
const OUTPUT_DIR = path.resolve(__dirname, '../../topojson/polygons');
const SCALES = ['low', 'medium', 'high'];
const QUANTIZATION = 1e5;

// Write a FeatureCollection as a quantized TopoJSON under the single object
// key `countries`. Returns the byte size written.
const writeTopojson = (relPath, features) => {
  const filePath = path.join(OUTPUT_DIR, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const collection = { type: 'FeatureCollection', features };
  const topo = quantize(topology({ countries: collection }), QUANTIZATION);
  fs.writeFileSync(filePath, JSON.stringify(topo));
  return fs.statSync(filePath).size;
};

const buildScale = (scale) => {
  const inputPath = path.join(INPUT_DIR, `country-polygon-${scale}-detail.geojson`);
  const geojson = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  // Map each feature to an atlas country by iso_a2; drop unknowns (e.g. the
  // disputed X-codes XH/XU/XY/XZ that don't resolve to an ISO country).
  const byCountry = new Map();
  let dropped = 0;
  for (const feature of geojson.features) {
    const country = atlas.getCountry(feature.properties.iso_a2);
    if (!country) { dropped++; continue; }
    feature.properties = { isoAlpha2: country.isoAlpha2, name: country.name };
    if (!byCountry.has(country.isoAlpha2)) byCountry.set(country.isoAlpha2, []);
    byCountry.get(country.isoAlpha2).push(feature);
  }

  const all = [...byCountry.values()].flat();
  let files = 0;

  // world
  writeTopojson(path.join(scale, 'world.json'), all); files++;

  // countries
  for (const [iso2, feats] of byCountry) {
    writeTopojson(path.join(scale, `${iso2}.json`), feats); files++;
  }

  // regions + subregions (skip any with no geometry at this scale)
  const groups = [
    ...atlas.regions.map(r => [r.slug, r.countries]),
    ...atlas.subregions.map(s => [s.slug, s.countries]),
  ];
  for (const [slug, members] of groups) {
    const codes = new Set(members.map(c => c.isoAlpha2));
    const feats = all.filter(f => codes.has(f.properties.isoAlpha2));
    if (feats.length) { writeTopojson(path.join(scale, `${slug}.json`), feats); files++; }
  }

  console.log(`  ${scale}: ${byCountry.size} countries, ${files} files (dropped ${dropped} non-ISO features)`);
};

module.exports = () => {
  console.log('Building polygon topojson');
  for (const scale of SCALES) buildScale(scale);
};

if (require.main === module) module.exports();
