// Integration tests — these hit the live jsDelivr CDN and are excluded from the
// default `yarn test` run. Run explicitly with `yarn test:integration`.
//
// SKIPPED until @reuters-graphics/graphics-atlas-topojson is published to npm
// (the FETCH_BASE package). Once it's live, drop the `.skip` and bump
// TOPOJSON_VERSION in lib/index.js. See #31.
const assert = require('node:assert/strict');
const AtlasMetadataClient = require('../../dist');

const client = new AtlasMetadataClient();

describe.skip('Metadata client — topojson fetchers (integration)', function() {
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
