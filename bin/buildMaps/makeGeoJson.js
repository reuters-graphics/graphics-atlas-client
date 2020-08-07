const fs = require('fs');
const path = require('path');
const shapefile = require('shapefile');
const simplify = require('simplify-geojson');
const AtlasClient = require('../../dist/index.js');
const getCentroid = require('@turf/centroid').default;
const getCustomCentroids = require('./utils/getCustomCentroids');
const {
  WRITE_PATH,
  SHAPEFILE_FILE_PATH,
} = require('./utils/locations');

const atlas = new AtlasClient();

const writeFeatureCollection = async(source, simplification, fileName) => {
  const filePath = path.join(WRITE_PATH, fileName);
  // if (fs.existsSync(filePath)) return;

  const GeoJSON = {
    type: 'FeatureCollection',
    bbox: source.bbox,
    features: [],
  };

  const customCentroids = getCustomCentroids();

  const processGeo = (geo) => {
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
    GeoJSON.features.push(simplify(geo, simplification));
  };

  return source.read().then(function(result) {
    if (result.done) return;
    processGeo(result.value);
    return source.read().then(function repeat(result) {
      if (result.done) return;
      processGeo(result.value);
      return source.read().then(repeat);
    });
  }).then(function() {
    fs.writeFileSync(filePath, JSON.stringify(GeoJSON));
    const stats = fs.statSync(filePath);
    console.log(`${fileName} ${Math.round(stats.size / 1000000)}MB`);
  });
};

module.exports = async() => {
  console.log('Converting to GeoJSON');
  let geoJson;
  geoJson = await shapefile.open(SHAPEFILE_FILE_PATH);
  await writeFeatureCollection(geoJson, 0.01, 'gadm_001.geo.json');
  geoJson = await shapefile.open(SHAPEFILE_FILE_PATH);
  await writeFeatureCollection(geoJson, 0.001, 'gadm_0001.geo.json');
  geoJson = await shapefile.open(SHAPEFILE_FILE_PATH);
  await writeFeatureCollection(geoJson, 0.0005, 'gadm_00005.geo.json');
};
