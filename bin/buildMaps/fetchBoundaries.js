const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const simplify = require('@turf/simplify').default;
const ensureDir = require('./utils/ensureDir');
const {
  DISPUTED_BOUNDARIES_URI,
  DISPUTED_BOUNDARIES_FILE_PATH,
} = require('./utils/locations');

const fetchArchive = async(level) => {
  console.log('Fetching disputed boundaries');
  ensureDir(DISPUTED_BOUNDARIES_FILE_PATH);
  const response = await fetch(DISPUTED_BOUNDARIES_URI);
  if (!response.ok) throw new Error(`Failed to fetch disputed boundaries: ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(DISPUTED_BOUNDARIES_FILE_PATH));

  let stats = fs.statSync(DISPUTED_BOUNDARIES_FILE_PATH);
  console.log(`Un-simplified ${Math.round(stats.size / 1000)}KB`);
  const GeoJson = JSON.parse(fs.readFileSync(DISPUTED_BOUNDARIES_FILE_PATH));
  const simplified = simplify(GeoJson, { tolerance: 0.01, highQuality: false });
  fs.writeFileSync(DISPUTED_BOUNDARIES_FILE_PATH, JSON.stringify(simplified));
  stats = fs.statSync(DISPUTED_BOUNDARIES_FILE_PATH);
  console.log(`Simplified ${Math.round(stats.size / 1000)}KB`);
};

module.exports = async() => {
  if (fs.existsSync(DISPUTED_BOUNDARIES_FILE_PATH)) return;
  await fetchArchive();
};
