// Integration tests — these hit the live jsDelivr CDN and are excluded from the
// default `pnpm test` run. Run explicitly with `pnpm test:integration`.
//
// The topojson assets ship inside this package; the client's FETCH_BASE
// (lib/index.js) points at this package's own version-pinned npm URL on
// jsDelivr. They can therefore only run once a version carrying the `topojson/`
// assets is on npm — before that the whole suite is skipped (see below) rather
// than failing on a 404 it can't do anything about.
const assert = require('node:assert/strict');
const AtlasMetadataClient = require('../../dist');

const client = new AtlasMetadataClient();

describe('Metadata client — topojson fetchers (integration)', function() {
  this.timeout(30000);

  // Skip the suite when the published version has no geometry yet (404); any
  // other failure is a real problem and should surface.
  before(async function() {
    try {
      await client.fetchGlobalTopojson();
    } catch (err) {
      if (/\(404\)/.test(err.message)) {
        console.log('    ↳ skipped: no published version with topojson/ assets yet');
        this.skip();
      }
      throw err;
    }
  });

  // Polygons
  it('Should fetch world polygons (default medium)', async function() {
    const topojson = await client.fetchGlobalTopojson();
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch region polygons at high detail', async function() {
    const topojson = await client.fetchRegionTopojson('Europe', 'high');
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch subregion polygons', async function() {
    const topojson = await client.fetchSubregionTopojson('Western Europe');
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch country polygons at each detail level', async function() {
    for (const detail of ['low', 'medium', 'high']) {
      const topojson = await client.fetchCountryTopojson('DE', detail);
      assert.equal(topojson.type, 'Topology');
    }
  });

  // Lines (carry the `disputed` flag; world + UN region only)
  it('Should fetch global border lines', async function() {
    const topojson = await client.fetchGlobalLines();
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch region border lines', async function() {
    const topojson = await client.fetchRegionLines('Europe');
    assert.equal(topojson.type, 'Topology');
  });
});
