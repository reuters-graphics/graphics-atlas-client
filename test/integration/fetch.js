// Integration tests — these hit the live jsDelivr CDN and are excluded from the
// default `yarn test` run. Run explicitly with `yarn test:integration`.
//
// Served from the public graphics-atlas-topojson repo via jsDelivr /gh at the
// pinned tag in lib/index.js (FETCH_BASE). When the assets move to npm, keep
// these running and just repoint FETCH_BASE.
const assert = require('node:assert/strict');
const AtlasMetadataClient = require('../../dist');

const client = new AtlasMetadataClient();

describe('Metadata client — topojson fetchers (integration)', function() {
  this.timeout(30000);

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
