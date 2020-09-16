const CovidMetadataClient = require('../dist');
const expect = require('expect.js');

const client = new CovidMetadataClient();

describe('Metadata client', function() {
  this.timeout(10000);

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
    expect(country.dataProfile.population.year).to.be('2019');
    expect(country.dataProfile.population.d).to.be.a('number');
  });

  it('Should have 34 countries without pop', function() {
    const countries = client.countries;
    const nopops = countries.filter(c => c.dataProfile.population === null);
    expect(nopops.length).to.be(34);
  });

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

  it('Should fetch country topojson', function(done) {
    const country = client.getCountry('DE');
    client.fetchCountryTopojson(country.isoAlpha2)
      .then(topojson => {
        expect(topojson.type).to.be('Topology');
        done();
      });
  });
});
