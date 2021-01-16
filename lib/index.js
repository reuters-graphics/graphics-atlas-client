import fetch from 'cross-fetch';
import metadata from './data/metadata.json';
import uniqBy from 'lodash/uniqBy';

const FETCH_BASE = 'https://cdn.jsdelivr.net/npm/@reuters-graphics/graphics-atlas-client@latest';

class MetadataClient {
  constructor() {
    this._metadata = metadata;
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(metadata) {
    this._metadata = metadata;
  }

  get regions() {
    const regions = uniqBy(this._metadata.filter(c => c.unRegion).map(c => c.unRegion), d => d.name);
    return regions.map((region) => ({
      ...region,
      subregions: uniqBy(
        this._metadata
          .filter(c => c.unRegion)
          .filter(c => c.unRegion.name === region.name)
          .map(c => c.unSubregion),
        d => d.name
      ),
      countries: this._metadata
        .filter(c => c.unRegion)
        .filter(c => c.unRegion.name === region.name)
        .map(c => ({
          name: c.name,
          slug: c.slug,
          isoAlpha2: c.isoAlpha2,
          isoAlpha3: c.isoAlpha3,
          isoNumeric: c.isoNumeric,
          translations: c.translations,
          abbreviations: c.abbreviations,
          dataProfile: c.dataProfile,
        })),
    }));
  }

  getRegion(regionNameOrSlug) {
    const region = this.regions.find(r => (
      r.slug === regionNameOrSlug ||
      r.name === regionNameOrSlug
    ));
    if (!region) return null;
    return region;
  }

  getRegionSlug(regionName) {
    const region = this.regions.find(r => r.name === regionName);
    if (!region) return null;
    return region.slug;
  }

  getRegionName(regionSlug) {
    const region = this.regions.find(r => r.slug === regionSlug);
    if (!region) return null;
    return region.name;
  }

  get subregions() {
    const subregions = uniqBy(this._metadata.filter(c => !!c.unSubregion).map(c => ({
      name: c.unSubregion.name,
      slug: c.unSubregion.slug,
      region: c.unRegion,
    })), 'name');

    return subregions.map(({ name, slug, region }) => ({
      name,
      slug,
      region,
      countries: this._metadata
        .filter(c => c.unSubregion)
        .filter(c => c.unSubregion.name === name)
        .map(c => ({
          name: c.name,
          slug: c.slug,
          isoAlpha2: c.isoAlpha2,
          isoAlpha3: c.isoAlpha3,
          isoNumeric: c.isoNumeric,
          translations: c.translations,
          abbreviations: c.abbreviations,
          dataProfile: c.dataProfile,
        })),
    }));
  }

  getSubregion(subregionNameOrSlug) {
    const subregion = this.subregions.find(s => (
      s.slug === subregionNameOrSlug ||
      s.name === subregionNameOrSlug
    ));
    if (!subregion) return null;
    return subregion;
  }

  getSubregionSlug(subregionName) {
    const subregion = this.subregions.find(s => s.name === subregionName);
    if (!subregion) return null;
    return subregion.slug;
  }

  getSubregionName(subregionSlug) {
    const subregion = this.subregions.find(s => s.slug === subregionSlug);
    if (!subregion) return null;
    return subregion.name;
  }

  get countries() {
    return this._metadata
      .map(c => ({
        name: c.name,
        slug: c.slug,
        isoAlpha2: c.isoAlpha2,
        isoAlpha3: c.isoAlpha3,
        isoNumeric: c.isoNumeric,
        translations: c.translations,
        abbreviations: c.abbreviations,
        dataProfile: c.dataProfile,
        region: c.unRegion,
        subregion: c.unSubregion,
      }));
  }

  getCountry(nameSlugOrCode) {
    let country;
    country = this.countries.find(d => d.slug === nameSlugOrCode);
    if (country) return country;
    country = this.countries.find(d => d.name === nameSlugOrCode);
    if (country) return country;
    country = this.countries.find(d => (
      d.isoAlpha2 === nameSlugOrCode ||
      d.isoAlpha3 === nameSlugOrCode ||
      d.isoNumeric === nameSlugOrCode
    ));
    if (country) return country;
    return null;
  }

  getCountrySlug(nameOrCode) {
    const country = this.getCountry(nameOrCode);
    if (!country) return null;
    return country.slug;
  }

  getCountryName(slugOrCode) {
    const country = this.getCountry(slugOrCode);
    if (!country) return null;
    return country.name;
  }

  getCountriesByRegion(nameOrSlug) {
    const region = this.regions.find(r => (
      r.slug === nameOrSlug ||
      r.name === nameOrSlug
    ));
    if (!region) return null;
    return region.countries.slice();
  }

  getCountriesBySubregion(nameOrSlug) {
    const subregion = this.subregions.find(s => (
      s.slug === nameOrSlug ||
      s.name === nameOrSlug
    ));
    if (!subregion) return null;
    return subregion.countries.slice();
  }

  getRegionByCountry(nameSlugOrCode) {
    const country = this.getCountry(nameSlugOrCode);
    if (!country) return null;
    return this.regions
      .find(r => r.countries.filter(c => c.slug === country.slug).length > 0);
  }

  getSubregionByCountry(nameSlugOrCode) {
    const country = this.getCountry(nameSlugOrCode);
    if (!country) return null;
    return this.subregions
      .find(r => r.countries.filter(c => c.slug === country.slug).length > 0);
  }

  // Data fetchers
  async fetchGlobalTopojson() {
    const response = await fetch(FETCH_BASE + '/topojson/world.json');
    const topojson = await response.json();
    return topojson;
  }

  async fetchRegionTopojson(regionNameOrSlug) {
    const region = this.getRegion(regionNameOrSlug);
    const response = await fetch(FETCH_BASE + `/topojson/${region.slug}.json`);
    const topojson = await response.json();
    return topojson;
  }

  async fetchSubregionTopojson(subregionNameOrSlug) {
    const subregion = this.getSubregion(subregionNameOrSlug);
    const response = await fetch(FETCH_BASE + `/topojson/${subregion.slug}.json`);
    const topojson = await response.json();
    return topojson;
  }

  async fetchCountryTopojson(nameSlugOrCode) {
    const country = this.getCountry(nameSlugOrCode);
    const response = await fetch(FETCH_BASE + `/topojson/${country.isoAlpha2}.json`);
    const topojson = await response.json();
    return topojson;
  }
}

export default MetadataClient;
