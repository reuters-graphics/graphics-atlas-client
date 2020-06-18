const { sheetToData } = require('@newswire/sheet-to-data');
const getAuth = require('./../common/getAuth');

async function run(spreadsheetId) {
  const auth = await getAuth();
  return sheetToData({ spreadsheetId, auth });
}

module.exports = async(spreadsheetId) => {
  const data = await run(spreadsheetId).catch((e) => {
    console.error('Error fetching sheet:', e);
  });
  return data;
};
