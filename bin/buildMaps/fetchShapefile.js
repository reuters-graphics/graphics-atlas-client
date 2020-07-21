const fs = require('fs');
const axios = require('axios');
const unzipper = require('unzipper');
const ensureDir = require('./utils/ensureDir');
const {
  SHAPEFILE_URI,
  SHAPEFILE_ARCHIVE_PATH,
  SHAPEFILE_ARCHIVE_DIR,
} = require('./utils/locations');

const fetchArchive = async(level) => {
  console.log('Fetching shapefile archive');
  ensureDir(SHAPEFILE_ARCHIVE_PATH);
  const writer = fs.createWriteStream(SHAPEFILE_ARCHIVE_PATH);
  const response = await axios.get(SHAPEFILE_URI, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const unzipArchive = async() => {
  console.log('Unzipping shapefile archive');
  return new Promise((resolve, reject) => {
    fs.createReadStream(SHAPEFILE_ARCHIVE_PATH)
      .pipe(
        unzipper.Extract({ path: SHAPEFILE_ARCHIVE_DIR })
          .on('close', resolve)
      );
  });
};

module.exports = async() => {
  if (fs.existsSync(SHAPEFILE_ARCHIVE_PATH)) return;
  await fetchArchive();
  await unzipArchive();
};
