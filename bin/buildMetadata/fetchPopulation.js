const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const unzipper = require('unzipper');
const ensureDir = require('../buildMaps/utils/ensureDir');
const parseCSV = require('csv-parse/sync').parse;

const WRITE_PATH = path.resolve(__dirname, '../../tmp/');
const ARCHIVE_URI = 'https://api.worldbank.org/v2/en/indicator/SP.POP.TOTL?downloadformat=csv';
const ARCHIVE_PATH = path.join(WRITE_PATH, 'world_bank_pop.zip');
const ARCHIVE_DIR = path.join(WRITE_PATH, 'world_bank_pop');

const fetchArchive = async() => {
  console.log('Fetching population archive');
  ensureDir(ARCHIVE_DIR);
  const response = await fetch(ARCHIVE_URI);
  if (!response.ok) {
    throw new Error(`Failed to fetch World Bank population archive: ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(ARCHIVE_PATH));
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

  const files = fs.readdirSync(path.join(WRITE_PATH, 'world_bank_pop'));
  const POP_FILE = path.join(ARCHIVE_DIR, files.filter(d => d.match(/^API/))[0]);
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
