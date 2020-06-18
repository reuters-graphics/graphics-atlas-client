const CovidMetadataClient = require('../dist');
const expect = require('expect.js');

const client = new CovidMetadataClient();

describe('Metadata client', function() {
  it('Should create a graphic', function() {
    console.log(client.regions.find(r => r.name === 'Asia'));

    console.log(client.getCountriesByRegion('oceania'));
    expect(true).to.be(true);
  });
});
