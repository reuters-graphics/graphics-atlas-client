const fs = require('fs');
const path = require('path');
const { topology } = require('topojson-server');
const { quantize, feature } = require('topojson-client');
const { geoArea } = require('d3-geo');
const AtlasClient = require('../../dist/index.js');

const atlas = new AtlasClient();

const INPUT_DIR = path.resolve(__dirname, '../../input');
const OUTPUT_DIR = path.resolve(__dirname, '../../topojson/polygons');
const SCALES = ['low', 'medium', 'high'];

// Per-scale quantization grid. Flat 1e5 collapses small rings at medium/high,
// flipping their winding so d3-geo fills the country's complement (#47).
const QUANTIZATION = { low: 1e5, medium: 1e6, high: 1e6 };

// A polygon enclosing more than a hemisphere is wound backwards for d3-geo.
const INVERSION_LIMIT = 2 * Math.PI;
const isInverted = (f) => geoArea(f) > INVERSION_LIMIT;

// Reverse any backwards-wound polygon; per sub-polygon so one flipped island
// doesn't drag a whole MultiPolygon (#47).
const rewindPolygon = (rings) =>
  geoArea({ type: 'Polygon', coordinates: [rings[0]] }) > INVERSION_LIMIT
    ? rings.map((r) => r.slice().reverse())
    : rings;
const rewindFeature = (f) => {
  const g = f.geometry;
  if (!g) return;
  if (g.type === 'Polygon') g.coordinates = rewindPolygon(g.coordinates);
  else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map(rewindPolygon);
};

// Quantize (this is what breaks winding), rewind the inverted rings, then
// rebuild + re-quantize on the same grid — idempotent, so the repair sticks and
// files stay small. Returns the byte size written (#47).
const writeTopojson = (relPath, features, quantization) => {
  const filePath = path.join(OUTPUT_DIR, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const collection = { type: 'FeatureCollection', features };
  const quantized = quantize(topology({ countries: collection }), quantization);
  const repaired = feature(quantized, quantized.objects.countries);
  repaired.features.forEach(rewindFeature);
  const topo = quantize(topology({ countries: repaired }), quantization);

  // Guard: fail the build if a refresh/dep bump reintroduces inversion (#47).
  const inverted = feature(topo, topo.objects.countries).features
    .filter(isInverted)
    .map((f) => f.properties.name || f.properties.isoAlpha2);
  if (inverted.length) {
    throw new Error(
      `Inverted polygon(s) in ${relPath}: ${inverted.join(', ')} — winding ` +
      `repair failed. Raise QUANTIZATION for this scale or extend the rewind (#47).`
    );
  }

  fs.writeFileSync(filePath, JSON.stringify(topo));
  return fs.statSync(filePath).size;
};

const buildScale = (scale) => {
  const quantization = QUANTIZATION[scale];
  const inputPath = path.join(INPUT_DIR, `country-polygon-${scale}-detail.geojson`);
  const geojson = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  // Map each feature to an atlas country by iso_a2; drop unknowns (e.g. the
  // disputed X-codes XH/XU/XY/XZ that don't resolve to an ISO country).
  const byCountry = new Map();
  let dropped = 0;
  for (const feat of geojson.features) {
    const country = atlas.getCountry(feat.properties.iso_a2);
    if (!country) { dropped++; continue; }
    feat.properties = { isoAlpha2: country.isoAlpha2, name: country.name };
    if (!byCountry.has(country.isoAlpha2)) byCountry.set(country.isoAlpha2, []);
    byCountry.get(country.isoAlpha2).push(feat);
  }

  const all = [...byCountry.values()].flat();
  let files = 0;

  // world
  writeTopojson(path.join(scale, 'world.json'), all, quantization); files++;

  // countries
  for (const [iso2, feats] of byCountry) {
    writeTopojson(path.join(scale, `${iso2}.json`), feats, quantization); files++;
  }

  // regions + subregions (skip any with no geometry at this scale)
  const groups = [
    ...atlas.regions.map(r => [r.slug, r.countries]),
    ...atlas.subregions.map(s => [s.slug, s.countries]),
  ];
  for (const [slug, members] of groups) {
    const codes = new Set(members.map(c => c.isoAlpha2));
    const feats = all.filter(f => codes.has(f.properties.isoAlpha2));
    if (feats.length) { writeTopojson(path.join(scale, `${slug}.json`), feats, quantization); files++; }
  }

  console.log(`  ${scale}: ${byCountry.size} countries, ${files} files (dropped ${dropped} non-ISO features)`);
};

module.exports = () => {
  console.log('Building polygon topojson');
  for (const scale of SCALES) buildScale(scale);
};

if (require.main === module) module.exports();
