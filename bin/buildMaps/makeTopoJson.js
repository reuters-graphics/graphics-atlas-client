const fs = require('fs');
const path = require('path');
const topojson = require('topojson');
const gzipSize = require('gzip-size');
const chalk = require('chalk');
const {
  WRITE_PATH,
  TOPOJSON_WRITE_PATH,
  DISPUTED_BOUNDARIES_FILE_PATH,
} = require('./utils/locations');
const ensureDir = require('./utils/ensureDir');
const AtlasClient = require('../../dist/index.js');

const atlas = new AtlasClient();

const logSize = (filePath) => {
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const uncompressed = Math.round(stats.size / 1000);
  const compressed = Math.round(gzipSize.fileSync(filePath) / 1000);
  console.log(chalk`> {yellow ${fileName}} ${uncompressed}KB ~ {green ${compressed}KB}`);
};

const getCountryGeoJson = (topology, country) => {
  const geoJson = topojson.feature(topology, country);
  return geoJson;
};

const writeTopology = (fileName, geoJson) => {
  const filePath = path.join(TOPOJSON_WRITE_PATH, fileName);
  ensureDir(filePath);
  let topology;
  if (geoJson.type === 'FeatureCollection') {
    topology = topojson.topology({ countries: geoJson });
  } else {
    topology = topojson.topology({ country: geoJson });
  }

  fs.writeFileSync(filePath, JSON.stringify(topology));
  logSize(filePath);
};

const createCountryMaps = async(topology) => {
  console.log('Creating country maps');
  const countries = topology.objects.countries.geometries;
  for (const country of countries) {
    const geoJson = getCountryGeoJson(topology, country);
    const metadata = atlas.getCountry(country.properties.isoAlpha2);
    const fileName = `${metadata.isoAlpha2}.json`;
    writeTopology(fileName, geoJson);
  }
};

const createRegionMaps = async(topology) => {
  console.log('Creating region maps');
  const countries = topology.objects.countries.geometries;
  for (const region of atlas.regions) {
    const countryCodes = region.countries.map(c => c.isoAlpha2);
    const regionCountries = countries.filter(c => countryCodes.indexOf(c.properties.isoAlpha2) > -1);
    const features = regionCountries.map(rc => getCountryGeoJson(topology, rc));
    const geoJson = { type: 'FeatureCollection', features };
    const fileName = `${region.slug}.json`;
    writeTopology(fileName, geoJson);
  }
};

const createSubregionMaps = async(topology) => {
  console.log('Creating subregion maps');
  const countries = topology.objects.countries.geometries;
  for (const subregion of atlas.subregions) {
    const countryCodes = subregion.countries.map(c => c.isoAlpha2);
    const subregionCountries = countries.filter(c => countryCodes.indexOf(c.properties.isoAlpha2) > -1);
    const features = subregionCountries.map(rc => getCountryGeoJson(topology, rc));
    const geoJson = { type: 'FeatureCollection', features };
    const fileName = `${subregion.slug}.json`;
    writeTopology(fileName, geoJson);
  }
};

const createWorldMap = async(topology) => {
  console.log('Creating world map');
  const fileName = 'world.json';
  const filePath = path.join(TOPOJSON_WRITE_PATH, fileName);
  fs.writeFileSync(filePath, JSON.stringify(topology));
  logSize(filePath);
};

const createTopology = (geoJson, simplification, quantization) => {
  const disputedBoundaries = JSON.parse(fs.readFileSync(DISPUTED_BOUNDARIES_FILE_PATH, 'utf-8'));
  let topology;
  topology = topojson.topology({ countries: geoJson, disputedBoundaries });
  if (simplification) {
    topology = topojson.presimplify(topology, topojson.sphericalTriangleArea);
    topology = topojson.simplify(topology, simplification);
  }
  topology = topojson.quantize(topology, quantization);
  return topology;
};

const getGeo = (size) => {
  const geoJsonFile = path.join(WRITE_PATH, `gadm_${size}.geo.json`);
  return JSON.parse(fs.readFileSync(geoJsonFile, 'utf-8'));
};

module.exports = async() => {
  console.log('Converting to TopoJSON');
  await createCountryMaps(createTopology(getGeo('00005'), 0.01, 1e4));
  await createSubregionMaps(createTopology(getGeo('0001'), 0.0001, 1e4));
  await createRegionMaps(createTopology(getGeo('0001'), 0.0001, 1e5));
  await createWorldMap(createTopology(getGeo('01'), 0.0001, 1e5));
};
