const fs = require('fs');
const path = require('path');
const topojson = require('topojson');
const gzipSize = require('gzip-size');
const chalk = require('chalk');
const getCentroid = require('@turf/centroid').default;
const union = require('@turf/union').default;
const turfHelpers = require('@turf/helpers');
const {
  CUSTOM_TOPOJSON_WRITE_PATH,
  CUSTOM_TOPOJSON,
} = require('./utils/locations');
const ensureDir = require('./utils/ensureDir');
const getCustomCentroids = require('./utils/getCustomCentroids');
const AtlasClient = require('../../dist/index.js');

const atlas = new AtlasClient();

const customCentroids = getCustomCentroids();

const createCountryProperties = (geo) => {
  const isoAlpha3 = geo.properties.GID_0;
  const country = atlas.getCountry(isoAlpha3);
  if (!country) return null;
  const customCentroid = customCentroids.find(d => d.isoAlpha3 === country.isoAlpha3);
  let centroid;
  if (!customCentroid) {
    // returned as [longitude, latitude]
    centroid = getCentroid(geo).geometry.coordinates;
  } else {
    centroid = [+customCentroid.longitude, +customCentroid.latitude];
  }
  geo.properties = { ...country, centroid };
  // delete geo.properties.translations;
  return geo;
};

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

const writeTopology = (fileName, geoJson, topology = null) => {
  const filePath = path.join(CUSTOM_TOPOJSON_WRITE_PATH, fileName);
  ensureDir(filePath);
  if (!topology) {
    if (geoJson.type === 'FeatureCollection') {
      topology = topojson.topology({ countries: geoJson });
    } else {
      topology = topojson.topology({ country: geoJson });
    }
  }
  topology = topojson.quantize(topology, 1e6);

  fs.writeFileSync(filePath, JSON.stringify(topology));
  logSize(filePath);
};

const filterDisputedBoundaries = (topology, countries) => {
  const countryCodes = countries.map(c => c.isoAlpha3);
  const disputedBoundaries = topojson.feature(topology, topology.objects.disputedBoundaries);
  const features = disputedBoundaries.features.filter(f => {
    if (!f.geometry) return false;
    return (
      countryCodes.includes(f.properties.adm0_a3_l) ||
      countryCodes.includes(f.properties.adm0_a3_r)
    );
  });
  return {
    disputedBoundaries: { type: 'FeatureCollection', features },
  };
};

const makeLand = (features) => {
  const polygons = [];
  features.forEach(feature => {
    if (!feature.geometry) return;
    if (feature.geometry.type === 'Polygon') {
      polygons.push(turfHelpers.polygon(feature.geometry.coordinates));
      return;
    }
    if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        polygons.push(turfHelpers.polygon(polygon));
      });
    }
  });
  return union(...polygons);
};

const createCountryMaps = async(topology) => {
  console.log('Creating country maps');
  const countries = topology.objects.countries.geometries;
  for (const country of countries) {
    const geoJson = getCountryGeoJson(topology, country);
    const metadata = atlas.getCountry(country.properties.isoAlpha2);
    const fileName = `${metadata.isoAlpha2}.json`;
    const { disputedBoundaries } = filterDisputedBoundaries(topology, [metadata]);
    const countryTopology = topojson.topology({
      countries: geoJson,
      disputedBoundaries,
    });
    writeTopology(fileName, null, countryTopology);
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
    const { disputedBoundaries } = filterDisputedBoundaries(topology, subregion.countries);
    const land = makeLand(features);
    const subregionTopology = topojson.topology({
      countries: geoJson,
      disputedBoundaries,
      land,
    });
    const fileName = `${subregion.slug}.json`;
    writeTopology(fileName, null, subregionTopology);
  }
};

const createRegionMaps = async(topology) => {
  console.log('Creating region maps');
  const { countries } = topology.objects;
  for (const region of atlas.regions) {
    const countryCodes = region.countries.map(c => c.isoAlpha2);
    const regionCountries = countries.geometries.filter(c => countryCodes.indexOf(c.properties.isoAlpha2) > -1);
    const features = regionCountries.map(rc => getCountryGeoJson(topology, rc));
    const geoJson = { type: 'FeatureCollection', features };
    const { disputedBoundaries } = filterDisputedBoundaries(topology, region.countries);
    const land = makeLand(features);
    const regionTopology = topojson.topology({
      countries: geoJson,
      disputedBoundaries,
      land,
    });
    const fileName = `${region.slug}.json`;
    writeTopology(fileName, null, regionTopology);
  }
};

const createWorldMap = async(topology) => {
  console.log('Creating world map');

  const fileName = 'world.json';
  const filePath = path.join(CUSTOM_TOPOJSON_WRITE_PATH, fileName);
  ensureDir(filePath);
  topology = topojson.quantize(topology, 1e6);
  fs.writeFileSync(filePath, JSON.stringify(topology));
  logSize(filePath);
};

const getGeojson = () => {
  const topology = JSON.parse(fs.readFileSync(CUSTOM_TOPOJSON, 'utf-8'));
  const countries = topojson.feature(topology, topology.objects.gadm);
  // const borders = topojson.mesh(topology, topology.objects.gadm, (a, b) => a !== b);
  const disputedBoundaries = topojson.feature(topology, topology.objects.disputed);
  const land = topojson.feature(topology, topology.objects.land);
  return { countries, disputedBoundaries, land };
};

const getTopology = () => {
  const { countries, disputedBoundaries, land } = getGeojson();
  countries.features = countries.features
    .map(f => createCountryProperties(f))
    .filter(f => f);
  return topojson.topology({ countries, disputedBoundaries, land });
};

const run = async() => {
  console.log('Extracting topojson');
  const topology = getTopology();

  createWorldMap(topology);
  createRegionMaps(topology);
  createSubregionMaps(topology);
  createCountryMaps(topology);
};

run();
