const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const CENTROIDS_PATH = path.resolve(__dirname, '../../../data/custom_centroids.csv');
module.exports = () => parse(fs.readFileSync(CENTROIDS_PATH), {
  columns: true,
  skip_empty_lines: true,
});
