const fs = require('fs');
const axios = require('axios');
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
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

module.exports = async() => {
  if (fs.existsSync(DISPUTED_BOUNDARIES_FILE_PATH)) return;
  await fetchArchive();
};
