// Integration tests — these hit the live jsdelivr CDN and are excluded from the
// default `yarn test` run. Run explicitly with `yarn test:integration`.
const AtlasMetadataClient = require('../../dist');
const expect = require('expect.js');

const client = new AtlasMetadataClient();

describe('Metadata client — topojson fetchers (integration)', function() {
  this.timeout(30000);

  it('Should fetch world topojson', async function() {
    const topojson = await client.fetchGlobalTopojson();
    expect(topojson.type).to.be('Topology');
  });

  it('Should fetch region topojson', async function() {
    const region = client.getRegion('Europe');
    const topojson = await client.fetchRegionTopojson(region.name);
    expect(topojson.type).to.be('Topology');
  });

  it('Should fetch subregion topojson', async function() {
    const subregion = client.getSubregion('Western Europe');
    const topojson = await client.fetchSubregionTopojson(subregion.name);
    expect(topojson.type).to.be('Topology');
  });

  it('Should fetch country topojson', async function() {
    const country = client.getCountry('DE');
    const topojson = await client.fetchCountryTopojson(country.isoAlpha2);
    expect(topojson.type).to.be('Topology');
  });

  it('Should fetch a country at an explicit resolution', async function() {
    const topojson = await client.fetchCountryTopojson('DE', '110m');
    expect(topojson.type).to.be('Topology');
  });

  it('Should fall back to custom/ for a country lacking the resolution (Brazil)', async function() {
    // BR ships neither 50m nor 110m at root; must resolve via topojson/custom/BR.json
    const topojson = await client.fetchCountryTopojson('BR');
    expect(topojson.type).to.be('Topology');
  });

  it('Should reject an invalid resolution', async function() {
    let threw = false;
    try {
      await client.fetchCountryTopojson('DE', '10m');
    } catch (e) {
      threw = true;
    }
    expect(threw).to.be(true);
  });
});
