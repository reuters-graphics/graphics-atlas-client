// Integration tests — these hit the live jsdelivr CDN and are excluded from the
// default `yarn test` run. Run explicitly with `yarn test:integration`.
const assert = require('node:assert/strict');
const AtlasMetadataClient = require('../../dist');

const client = new AtlasMetadataClient();

describe('Metadata client — topojson fetchers (integration)', function() {
  this.timeout(30000);

  it('Should fetch world topojson', async function() {
    const topojson = await client.fetchGlobalTopojson();
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch region topojson', async function() {
    const region = client.getRegion('Europe');
    const topojson = await client.fetchRegionTopojson(region.name);
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch subregion topojson', async function() {
    const subregion = client.getSubregion('Western Europe');
    const topojson = await client.fetchSubregionTopojson(subregion.name);
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch country topojson', async function() {
    const country = client.getCountry('DE');
    const topojson = await client.fetchCountryTopojson(country.isoAlpha2);
    assert.equal(topojson.type, 'Topology');
  });

  it('Should fetch any country incl. ones absent from root resolutions (Brazil)', async function() {
    // custom/ is the complete set, so BR resolves directly.
    const topojson = await client.fetchCountryTopojson('BR');
    assert.equal(topojson.type, 'Topology');
  });
});
