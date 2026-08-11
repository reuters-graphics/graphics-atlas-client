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

  it('Should return country coordinates as [lon, lat] (GeoJSON order)', function() {
    const country = client.getCountry('DE');
    assert.ok(Array.isArray(country.coordinates));
    assert.equal(country.coordinates.length, 2);
    const [lon, lat] = country.coordinates;
    assert.ok(lon >= -180 && lon <= 180, 'lon in range');
    assert.ok(lat >= -90 && lat <= 90, 'lat in range');
    // Germany is ~[10.6, 51.5] — sanity check the order
    assert.ok(lon > 5 && lon < 16 && lat > 47 && lat < 55, 'DE roughly [lon, lat]');
    // every country has coordinates
    assert.ok(client.countries.every(c => Array.isArray(c.coordinates) && c.coordinates.length === 2));
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
    await assert.rejects(() => client.fetchRegionLines('not-a-region'));
    await assert.rejects(() => client.fetchCountryTopojson('not-a-country'));
  });

  it('Should reject an invalid detail level (network-free)', async function() {
    await assert.rejects(() => client.fetchCountryTopojson('DE', 'ultra'), /Invalid detail/);
    await assert.rejects(() => client.fetchGlobalTopojson('50m'), /Invalid detail/);
    await assert.rejects(() => client.fetchGlobalLines('xl'), /Invalid detail/);
  });

  it('Should expose polygon + line fetchers', function() {
    for (const m of [
      'fetchGlobalTopojson', 'fetchRegionTopojson', 'fetchSubregionTopojson',
      'fetchCountryTopojson', 'fetchGlobalLines', 'fetchRegionLines',
    ]) {
      assert.equal(typeof client[m], 'function');
    }
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

  it('Should return a country flag (flag-icons)', function() {
    const flag = client.getCountryFlag('Germany');
    assert.equal(flag.code, 'de');
    assert.equal(flag.className, 'fi fi-de');
    assert.equal(flag.squareClassName, 'fi fi-de fis');
    assert.match(flag.svg['4x3'], /\/flags\/4x3\/de\.svg$/);
    assert.match(flag.svg['1x1'], /\/flags\/1x1\/de\.svg$/);
    // resolves by name, slug or code
    assert.equal(client.getCountryFlag('fr').code, 'fr');
    assert.equal(client.getCountryFlag('france').code, 'fr');
    assert.equal(client.getCountryFlag('not-a-country'), null);
  });

  it('Should resolve flags for every country', function() {
    assert.ok(client.countries.every(c => client.getCountryFlag(c.isoAlpha2) !== null));
  });

  it('Should expose custom (non-country) flags and resolve them via getFlag', function() {
    assert.equal(client.customFlags.length, 22);
    // by custom code, slug and name (case-insensitive)
    assert.equal(client.getFlag('gb-sct').code, 'gb-sct');
    assert.equal(client.getFlag('scotland').code, 'gb-sct');
    assert.equal(client.getFlag('GB-SCT').code, 'gb-sct');
    assert.equal(client.getFlag('european-union').code, 'eu');
    assert.equal(client.getFlag('Kosovo').code, 'xk');
    // getFlag still resolves ISO countries
    assert.equal(client.getFlag('Germany').code, 'de');
    assert.equal(client.getFlag('nope'), null);
  });
});
