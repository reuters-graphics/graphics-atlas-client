const fs = require('fs');
const axios = require('axios');
const simplify = require('simplify-geojson');
const ensureDir = require('./utils/ensureDir');
const {
  DISPUTED_BOUNDARIES_URI,
  DISPUTED_BOUNDARIES_FILE_PATH,
} = require('./utils/locations');

const fetchArchive = async(level) => {
  console.log('Fetching disputed boundaries');
  ensureDir(DISPUTED_BOUNDARIES_FILE_PATH);
  const writer = fs.createWriteStream(DISPUTED_BOUNDARIES_FILE_PATH);
  const response = await axios.get(DISPUTED_BOUNDARIES_URI, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      let stats = fs.statSync(DISPUTED_BOUNDARIES_FILE_PATH);
      console.log(`Un-simplified ${Math.round(stats.size / 1000)}KB`);
      const GeoJson = JSON.parse(fs.readFileSync(DISPUTED_BOUNDARIES_FILE_PATH));
      const simplified = simplify(GeoJson, 0.01);
      fs.writeFileSync(DISPUTED_BOUNDARIES_FILE_PATH, JSON.stringify(simplified));
      stats = fs.statSync(DISPUTED_BOUNDARIES_FILE_PATH);
      console.log(`Simplified ${Math.round(stats.size / 1000)}KB`);
      resolve();
    });
    writer.on('error', reject);
  });
};

module.exports = async() => {
  if (fs.existsSync(DISPUTED_BOUNDARIES_FILE_PATH)) return;
  await fetchArchive();
};
