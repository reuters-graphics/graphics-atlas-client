const fetchShapefile = require('./fetchShapefile');
const fetchBoundaries = require('./fetchBoundaries');
const makeGeoJson = require('./makeGeoJson');
const makeTopoJson = require('./makeTopoJson');

const buildMaps = async() => {
  await fetchShapefile();
  await fetchBoundaries();
  await makeGeoJson();
  await makeTopoJson();
};

buildMaps();
