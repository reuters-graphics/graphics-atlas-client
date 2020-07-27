const fs = require('fs');
const path = require('path');
const axios = require('axios');
const unzipper = require('unzipper');
const ensureDir = require('../buildMaps/utils/ensureDir');
const parseCSV = require('csv-parse/lib/sync');

const WRITE_PATH = path.resolve(__dirname, '../../tmp/');
const ARCHIVE_URI = 'http://api.worldbank.org/v2/en/indicator/SP.POP.TOTL?downloadformat=csv';
const ARCHIVE_PATH = path.join(WRITE_PATH, 'world_bank_pop.zip');
const ARCHIVE_DIR = path.join(WRITE_PATH, 'world_bank_pop');
const POP_FILE = path.join(ARCHIVE_DIR, 'API_SP.POP.TOTL_DS2_en_csv_v2_1217749.csv');

const fetchArchive = async(level) => {
  console.log('Fetching population archive');
  ensureDir(WRITE_PATH);
  const writer = fs.createWriteStream(ARCHIVE_PATH);
  const response = await axios.get(ARCHIVE_URI, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const unzipArchive = async() => {
  console.log('Unzipping population archive');
  return new Promise((resolve, reject) => {
    fs.createReadStream(ARCHIVE_PATH)
      .pipe(
        unzipper.Extract({ path: ARCHIVE_DIR })
          .on('close', resolve)
      );
  });
};

module.exports = async() => {
  await fetchArchive();
  await unzipArchive();

  const popFile = fs.readFileSync(POP_FILE, 'utf-8').split('\r\n').slice(4).join('\n');

  const population = parseCSV(popFile, {
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    delimiter: ',',
  });

  return population;
};
