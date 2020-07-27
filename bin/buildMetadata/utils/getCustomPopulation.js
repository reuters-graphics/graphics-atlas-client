const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/lib/sync');

const POPULATION_PATH = path.resolve(__dirname, '../../../data/custom_population.csv');
module.exports = () => parse(fs.readFileSync(POPULATION_PATH), {
  columns: true,
  skip_empty_lines: true,
});
