const AtlasMetadataClient = require('../dist');
const expect = require('expect.js');

const client = new AtlasMetadataClient();

describe('Metadata client', function() {
  it('Should return regions', function() {
    expect(client.regions.length).to.be(6);
    const region = client.getRegion('Asia and the Middle East');
    expect(region.countries.length).to.be(51);
  });

  it('Should return subregions', function() {
    expect(client.subregions.length).to.be(22);
    const subregion = client.getSubregion('Western Europe');
    expect(subregion.countries.map(c => c.isoAlpha2).includes('DE')).to.be(true);
  });

  it('Should return region and subregion with country', function() {
    const country = client.getCountry('DE');
    expect(country.region.name).to.be('Europe');
    expect(country.subregion.name).to.be('Western Europe');
  });

  it('Should return country population', function() {
    const country = client.getCountry('DE');
    expect(country.dataProfile.population.d).to.be.a('number');
    expect(country.dataProfile.population.year).to.match(/^\d{4}$/);
  });

  it('Should have countries without pop', function() {
    const nopops = client.countries.filter(c => c.dataProfile.population === null);
    expect(nopops.length).to.be.greaterThan(0);
  });

  it('Should have a slug for every country', function() {
    expect(client.countries.every(c => !!c.slug)).to.be(true);
  });

  it('Should return null for a region-less country (Antarctica)', function() {
    expect(client.getCountry('AQ')).to.be.an('object');
    expect(client.getRegionByCountry('AQ')).to.be(null);
    expect(client.getSubregionByCountry('AQ')).to.be(null);
  });

  it('Should return null for unknown lookups', function() {
    expect(client.getCountry('not-a-country')).to.be(null);
    expect(client.getRegion('not-a-region')).to.be(null);
    expect(client.getSubregion('not-a-subregion')).to.be(null);
  });

  it('Should throw (not crash) when fetching topojson for unknown input', async function() {
    // Guards run before any network request, so these are network-free.
    let threw = false;
    try {
      await client.fetchRegionTopojson('not-a-region');
    } catch (e) {
      threw = true;
    }
    expect(threw).to.be(true);
  });
});
