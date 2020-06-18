const os = require('os');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const chalk = require('chalk');

module.exports = async() => {
  const filePath = '.reuters-graphics/google-api.json';
  const credentialsPath = path.join(os.homedir(), filePath);

  if (!fs.existsSync(credentialsPath)) {
    console.error(chalk`Couldn't find the Google API credentials file.

Get the file from the Global Graphics 1Password and put it at...

{yellow ~/${filePath}}

... then re-run.\n`);
    process.exit(0);
  }

  process.env.GCLOUD_PROJECT = 'reuters-graphics';
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
  const auth = await google.auth.getClient({
    scopes: [
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ],
  });
  return auth;
};
