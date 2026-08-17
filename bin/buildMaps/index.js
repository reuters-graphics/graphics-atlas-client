#!/usr/bin/env node
/**
 * build:maps — generate TopoJSON assets from reuters-graphics/country-borders.
 *
 * The map build lives in this package (folded in from the former
 * graphics-atlas-topojson repo). Output is written to ./topojson and shipped in
 * the published tarball; the client's fetch* methods read it from this package's
 * own version-pinned jsDelivr URL, and consumers can also import files directly
 * (tree-shakeable). See #46 for source coupling.
 *
 * Pipeline:
 *   1. fetchInput  — download the PINNED country-borders GeoJSON (polygons +
 *                    lines, 3 scales) via gh; reproducible from the recorded SHA.
 *   2. buildPolygons — join iso_a2 -> atlas country; cut per country / UN region
 *                    / UN subregion / world; TopoJSON + quantize, 3 scales.
 *   3. buildLines  — spatially assign border lines to UN regions (+ global),
 *                    preserving the `disputed` flag; TopoJSON + quantize.
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
