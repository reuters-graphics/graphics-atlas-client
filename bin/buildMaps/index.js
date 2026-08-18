#!/usr/bin/env node
/**
 * build:maps — generate the TopoJSON assets under ./topojson from
 * reuters-graphics/country-borders. Output ships in the published tarball.
 *
 * Pipeline:
 *   1. fetchInput    — download the pinned country-borders GeoJSON via `gh`.
 *   2. buildPolygons — join iso_a2 → atlas country; cut per country / UN region
 *                      / subregion / world; TopoJSON + quantize, 3 scales.
 *   3. buildLines    — assign border lines to UN regions (+ global), keeping the
 *                      `disputed` flag; TopoJSON + quantize.
 */
const fetchInput = require('./fetchInput');
const buildPolygons = require('./buildPolygons');
const buildLines = require('./buildLines');

const run = async () => {
  fetchInput();
  buildPolygons();
  buildLines();
  console.log('Done.');
};

run();
