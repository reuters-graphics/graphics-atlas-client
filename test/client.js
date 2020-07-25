const CovidMetadataClient = require('../dist');
const expect = require('expect.js');

const client = new CovidMetadataClient();

describe('Metadata client', function() {
  it('Should do stuff... TKTKTK', function() {
    console.log('regions', client.regions);
    console.log(client.regions.find(r => r.name === 'Asia'));

    console.log(client.getCountriesByRegion('oceania'));
    console.log(client.countries[0]);
    expect(true).to.be(true);
  });
});
