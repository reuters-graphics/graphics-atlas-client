const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const unzipper = require('unzipper');
const ensureDir = require('./utils/ensureDir');
const {
  SHAPEFILE_URI,
  SHAPEFILE_ARCHIVE_PATH,
  SHAPEFILE_ARCHIVE_DIR,
} = require('./utils/locations');

const fetchArchive = async() => {
  console.log('Fetching shapefile archive');
  ensureDir(SHAPEFILE_ARCHIVE_PATH);
  const response = await fetch(SHAPEFILE_URI);
  if (!response.ok) throw new Error(`Failed to fetch shapefile archive: ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(SHAPEFILE_ARCHIVE_PATH));
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
