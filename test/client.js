const assert = require('node:assert/strict');
const AtlasMetadataClient = require('../dist');

const client = new AtlasMetadataClient();

describe('Metadata client', function() {
  it('Should return regions', function() {
    assert.equal(client.regions.length, 6);
    const region = client.getRegion('Asia and the Middle East');
    assert.equal(region.countries.length, 51);
  });

  it('Should return subregions', function() {
    assert.equal(client.subregions.length, 22);
    const subregion = client.getSubregion('Western Europe');
    assert.ok(subregion.countries.map(c => c.isoAlpha2).includes('DE'));
  });

  it('Should return region and subregion with country', function() {
    const country = client.getCountry('DE');
    assert.equal(country.region.name, 'Europe');
    assert.equal(country.subregion.name, 'Western Europe');
  });

  it('Should return country population', function() {
    const country = client.getCountry('DE');
    assert.equal(typeof country.dataProfile.population.d, 'number');
    assert.match(country.dataProfile.population.year, /^\d{4}$/);
  });

  it('Should have countries without pop', function() {
    const nopops = client.countries.filter(c => c.dataProfile.population === null);
    assert.ok(nopops.length > 0);
  });

  it('Should have a slug for every country', function() {
    assert.ok(client.countries.every(c => !!c.slug));
  });

  it('Should return null for a region-less country (Antarctica)', function() {
    assert.equal(typeof client.getCountry('AQ'), 'object');
    assert.equal(client.getRegionByCountry('AQ'), null);
    assert.equal(client.getSubregionByCountry('AQ'), null);
  });

  it('Should return null for unknown lookups', function() {
    assert.equal(client.getCountry('not-a-country'), null);
    assert.equal(client.getRegion('not-a-region'), null);
    assert.equal(client.getSubregion('not-a-subregion'), null);
  });

  it('Should throw (not crash) when fetching topojson for unknown input', async function() {
    // Guards run before any network request, so these are network-free.
    await assert.rejects(() => client.fetchRegionTopojson('not-a-region'));
  });

  it('Should look up countries case-insensitively', function() {
    assert.equal(client.getCountry('france').name, 'France');
    assert.equal(client.getCountry('FRANCE').name, 'France');
    assert.equal(client.getCountry('fr').isoAlpha2, 'FR');
    assert.equal(client.getCountry('FrA').isoAlpha3, 'FRA');
  });

  it('Should look up a country by numeric ISO code', function() {
    assert.equal(client.getCountry(250).name, 'France');
    assert.equal(client.getCountry('250').name, 'France');
  });

  it('Should look up regions/subregions case-insensitively', function() {
    assert.equal(client.getRegion('europe').name, 'Europe');
    assert.equal(client.getSubregion('WESTERN EUROPE').name, 'Western Europe');
  });

  it('Should invalidate cache when metadata is replaced', function() {
    const fresh = new AtlasMetadataClient();
    const before = fresh.countries.length;
    fresh.metadata = fresh.metadata.slice(0, 5);
    assert.equal(fresh.countries.length, 5);
    assert.notEqual(fresh.countries.length, before);
  });
});
