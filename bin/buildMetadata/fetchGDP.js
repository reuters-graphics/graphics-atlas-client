const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const unzipper = require('unzipper');
const ensureDir = require('./utils/ensureDir');
const parseCSV = require('csv-parse/sync').parse;

const WRITE_PATH = path.resolve(__dirname, '../../tmp/');
const ARCHIVE_URI = 'https://api.worldbank.org/v2/en/indicator/NY.GDP.MKTP.CD?downloadformat=csv';
const ARCHIVE_PATH = path.join(WRITE_PATH, 'world_bank_gdp.zip');
const ARCHIVE_DIR = path.join(WRITE_PATH, 'world_bank_gdp');

const fetchArchive = async() => {
  console.log('Fetching GDP archive');
  ensureDir(ARCHIVE_DIR);
  const response = await fetch(ARCHIVE_URI);
  if (!response.ok) {
    throw new Error(`Failed to fetch World Bank GDP archive: ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(ARCHIVE_PATH));
};

const unzipArchive = async() => {
  console.log('Unzipping GDP archive');
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

  const files = fs.readdirSync(path.join(WRITE_PATH, 'world_bank_gdp'));
  const GDP_FILE = path.join(ARCHIVE_DIR, files.filter(d => d.match(/^API/))[0]);
  const gdpFile = fs.readFileSync(GDP_FILE, 'utf-8').split('\r\n').slice(4).join('\n');

  const gdp = parseCSV(gdpFile, {
    columns: true,
    skip_empty_lines: true,
    quote: '"',
    trim: true,
    delimiter: ',',
  });

  return gdp;
};
