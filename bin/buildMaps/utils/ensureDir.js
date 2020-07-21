const fs = require('fs');
const path = require('path');

module.exports = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
};
