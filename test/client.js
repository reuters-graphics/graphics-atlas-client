const CovidMetadataClient = require('../dist');
const expect = require('expect.js');

const client = new CovidMetadataClient();

describe('Metadata client', function() {
  it('Should return regions', function() {
    expect(client.regions.length).to.be(6);
    const region = client.getRegion('Northern America');
    expect(region.countries.length).to.be(5);
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
});
