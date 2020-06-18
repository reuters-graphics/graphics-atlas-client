const path = require('path');
const writeData = require('./common/writeData');
const getSheet = require('./sheets');

const getGoogleAPIsForLocale = async() => {
  const sheetId = '1GFob6TWk8uZQ-0jAARSlB26p-N4aCHEYAhwrUK5r1UI';
  const { metadata } = await getSheet(sheetId);

  const data = metadata.map(d => ({
    name: d.country_name,
    code: d.iso_country_code,
    region: d.un_region,
    subregion: d.un_subregion,
  }));

  const writePath = path.resolve(__dirname, '../../lib/data/metadata.json');

  writeData(writePath, data);
};

const run = async() => getGoogleAPIsForLocale();

run();
