const path = require('path');

const WRITE_PATH = path.resolve(__dirname, '../../../tmp/');
const SHAPEFILE_URI = 'https://biogeo.ucdavis.edu/data/gadm3.6/gadm36_levels_shp.zip';
const SHAPEFILE_ARCHIVE_PATH = path.join(WRITE_PATH, 'gadm.zip');
const SHAPEFILE_ARCHIVE_DIR = path.join(WRITE_PATH, 'gadm_shp/');
const SHAPEFILE_FILE_PATH = path.join(SHAPEFILE_ARCHIVE_DIR, 'gadm36_0.shp');
const TOPOJSON_FILE_PATH = path.join(WRITE_PATH, 'gadm.topo.json');
const TOPOJSON_WRITE_PATH = path.resolve(__dirname, '../../../topojson/');
const DISPUTED_BOUNDARIES_URI = 'https://geodata.lib.berkeley.edu/download/file/stanford-tq310nc7616-geojson.json';
const DISPUTED_BOUNDARIES_FILE_PATH = path.join(WRITE_PATH, 'disputed_boundaries.json');

const CUSTOM_DATA_DIR = path.resolve(__dirname, '../../../data/');
const CUSTOM_TOPOJSON = path.join(CUSTOM_DATA_DIR, 'world.simplified.topo.json');
const CUSTOM_TOPOJSON_WRITE_PATH = path.join(TOPOJSON_WRITE_PATH, './custom/');

module.exports = {
  WRITE_PATH,
  SHAPEFILE_URI,
  SHAPEFILE_ARCHIVE_PATH,
  SHAPEFILE_ARCHIVE_DIR,
  SHAPEFILE_FILE_PATH,
  TOPOJSON_FILE_PATH,
  TOPOJSON_WRITE_PATH,
  DISPUTED_BOUNDARIES_URI,
  DISPUTED_BOUNDARIES_FILE_PATH,
  CUSTOM_DATA_DIR,
  CUSTOM_TOPOJSON,
  CUSTOM_TOPOJSON_WRITE_PATH,
};
