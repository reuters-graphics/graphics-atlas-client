const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const topojson = require('topojson');
const parse = require('csv-parse/lib/sync');
const getCentroid = require('@turf/centroid').default;
const AtlasClient = require('../../dist/index.js');

const WRITE_PATH = path.resolve(__dirname, '../../');

const CENTROIDS_PATH = path.resolve(__dirname, '../../data/custom_centroids.csv');
const customCentroids = parse(fs.readFileSync(CENTROIDS_PATH), {
  columns: true,
  skip_empty_lines: true,
});

const atlas = new AtlasClient();

const fetchTopojson = async(level) => {
  const resp = await fetch(`https://cdn.jsdelivr.net/npm/world-atlas@2/countries-${level}.json`);
  return await resp.json();
};

const ensureDir = (fullPath) => {
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const writeTopology = (fileName, geoJson) => {
  const filePath = path.join(WRITE_PATH, `topojson/${fileName}`);
  ensureDir(filePath);

  const topology = topojson.topology([geoJson]);
  fs.writeFileSync(filePath, JSON.stringify(topology));
};

const getCountryGeoJson = (topology, country) => {
  const metadata = atlas.getCountry(country.id);
  if (!metadata) return null;
  const geoJson = topojson.feature(topology, country);
  const customCentroid = customCentroids.find(d =>
    atlas.getCountry(d.isoAlpha3).isoNumeric === country.id);
  let centroid;
  if (!customCentroid) {
    // returned as [longitude, latitude]
    centroid = getCentroid(geoJson).geometry.coordinates;
  } else {
    centroid = [+customCentroid.longitude, +customCentroid.latitude];
  }
  geoJson.properties = { ...metadata, centroid };
  return geoJson;
};

const createMaps = async(level) => {
  const topology = await fetchTopojson(level);
  const countries = topology.objects.countries.geometries;

  for (const country of countries) {
    const geoJson = getCountryGeoJson(topology, country);
    if (!geoJson) continue;
    const metadata = atlas.getCountry(country.id);
    const fileName = `${metadata.isoAlpha2}.${level}.json`;
    writeTopology(fileName, geoJson);
  }

  for (const region of atlas.regions) {
    const countryCodes = region.countries.map(c => c.isoNumeric);
    const regionCountries = countries.filter(c => countryCodes.indexOf(c.id) > -1);
    const features = regionCountries.map(rc => getCountryGeoJson(topology, rc)).filter(d => d);
    const geoJson = { type: 'FeatureCollection', features };
    const fileName = `${region.slug}.${level}.json`;
    writeTopology(fileName, geoJson);
  }

  for (const subregion of atlas.subregions) {
    const countryCodes = subregion.countries.map(c => c.isoNumeric);
    const subregionCountries = countries.filter(c => countryCodes.indexOf(c.id) > -1);
    const features = subregionCountries.map(rc => getCountryGeoJson(topology, rc)).filter(d => d);
    const geoJson = { type: 'FeatureCollection', features };
    const fileName = `${subregion.slug}.${level}.json`;
    writeTopology(fileName, geoJson);
  }
};

const build = async() => {
  const levels = ['110m', '50m'];
  for (const level of levels) {
    await createMaps(level);
  }
};

build();
