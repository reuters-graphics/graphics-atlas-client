const fs = require('fs');
const path = require('path');
const { topology } = require('topojson-server');
const { quantize } = require('topojson-client');
const booleanIntersects = require('@turf/boolean-intersects').default;
const bbox = require('@turf/bbox').default;
const AtlasClient = require('../../dist/index.js');

const atlas = new AtlasClient();

const INPUT_DIR = path.resolve(__dirname, '../../input');
const OUTPUT_DIR = path.resolve(__dirname, '../../topojson/lines');
const ALL_SCALES = ['low', 'medium', 'high'];
const QUANTIZATION = 1e5;

const bboxOverlap = (a, b) =>
  a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

const writeTopojson = (relPath, features) => {
  const filePath = path.join(OUTPUT_DIR, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const collection = { type: 'FeatureCollection', features };
  const topo = quantize(topology({ lines: collection }), QUANTIZATION);
  fs.writeFileSync(filePath, JSON.stringify(topo));
  return fs.statSync(filePath).size;
};

// Build per-UN-region polygon feature sets (with bboxes) so lines can be
// assigned to the regions they border. Region membership is topological, not
// detail-sensitive, so always assign from the low-detail polygons (fast) and
// cache across scales.
let _regionPolyCache = null;
const loadRegionPolys = () => {
  if (_regionPolyCache) return _regionPolyCache;
  const geojson = JSON.parse(
    fs.readFileSync(path.join(INPUT_DIR, `country-polygon-low-detail.geojson`), 'utf-8')
  );
  const bySlug = new Map();
  for (const feature of geojson.features) {
    const country = atlas.getCountry(feature.properties.iso_a2);
    if (!country) continue;
    const region = atlas.getRegionByCountry(country.isoAlpha2);
    if (!region) continue;
    if (!bySlug.has(region.slug)) bySlug.set(region.slug, []);
    bySlug.get(region.slug).push({ feature, bb: bbox(feature) });
  }
  _regionPolyCache = [...bySlug].map(([slug, feats]) => ({
    slug,
    feats,
    bb: [
      Math.min(...feats.map(f => f.bb[0])), Math.min(...feats.map(f => f.bb[1])),
      Math.max(...feats.map(f => f.bb[2])), Math.max(...feats.map(f => f.bb[3])),
    ],
  }));
  return _regionPolyCache;
};

const buildScale = (scale) => {
  const lines = JSON.parse(
    fs.readFileSync(path.join(INPUT_DIR, `country-lines-${scale}-detail.geojson`), 'utf-8')
  );
  const regions = loadRegionPolys();

  const buckets = new Map([['world', []]]);
  for (const line of lines.features) {
    const props = { disputed: line.properties.disputed || 0 };
    line.properties = props;
    buckets.get('world').push(line);

    const lb = bbox(line);
    for (const region of regions) {
      if (!bboxOverlap(lb, region.bb)) continue;
      const touches = region.feats.some(
        f => bboxOverlap(lb, f.bb) && booleanIntersects(line, f.feature)
      );
      if (touches) {
        if (!buckets.has(region.slug)) buckets.set(region.slug, []);
        buckets.get(region.slug).push(line);
      }
    }
  }

  let files = 0;
  for (const [slug, feats] of buckets) {
    if (!feats.length) continue;
    writeTopojson(path.join(scale, `${slug}.json`), feats);
    files++;
  }
  const perRegion = [...buckets].filter(([s]) => s !== 'world').map(([s, f]) => `${s}:${f.length}`);
  console.log(`  ${scale}: ${lines.features.length} lines -> ${files} files [world:${buckets.get('world').length}, ${perRegion.join(', ')}]`);
};

module.exports = (scales = ALL_SCALES) => {
  console.log('Building line topojson');
  for (const scale of scales) buildScale(scale);
};

if (require.main === module) {
  const scales = process.argv.slice(2).filter(s => ALL_SCALES.includes(s));
  module.exports(scales.length ? scales : ALL_SCALES);
}
