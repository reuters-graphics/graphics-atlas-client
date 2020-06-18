import metadata from './data/metadata.json';
import slugify from '@sindresorhus/slugify';
import uniqBy from 'lodash/uniqBy';

class CovidMetadataClient {
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
    const regions = uniqBy(this._metadata.map(c => c.region), d => d);
    return regions.map((region) => ({
      name: region,
      slug: slugify(region),
      subregions: uniqBy(
        this._metadata
          .filter(c => c.region === region)
          .map(c => ({
            name: c.subregion,
            slug: slugify(c.subregion),
          })), 'name'
      ),
      countries: this._metadata
        .filter(c => c.region === region)
        .map(c => ({
          name: c.name,
          slug: slugify(c.name),
          code: c.code,
        })),
    }));
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
    const subregions = uniqBy(this._metadata.map(c => ({
      name: c.subregion,
      region: c.region,
    })), 'name');

    return subregions.map(({ name, region }) => ({
      name,
      slug: slugify(name),
      region: {
        name: region,
        slug: slugify(region),
      },
      countries: this._metadata
        .filter(c => c.subregion === name)
        .map(c => ({
          name: c.name,
          slug: slugify(c.name),
          code: c.code,
        })),
    }));
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
        slug: slugify(c.name),
        code: c.code,
      }));
  }

  getCountrySlug(countryNameOrCode) {
    const country = this.countries.find(c => (
      c.name === countryNameOrCode ||
      c.code === countryNameOrCode
    ));
    if (!country) return null;
    return country.slug;
  }

  getCountryCode(countrySlugOrName) {
    const country = this.countries.find(c => (
      c.name === countrySlugOrName ||
      c.slug === countrySlugOrName
    ));
    if (!country) return null;
    return country.code;
  }

  getCountryName(countrySlugOrCode) {
    const country = this.countries.find(c => (
      c.slug === countrySlugOrCode ||
      c.code === countrySlugOrCode
    ));
    if (!country) return null;
    return country.name;
  }

  getCountriesByRegion(regionNameOrSlug) {
    const slug = slugify(regionNameOrSlug);
    const region = this.regions.find(r => r.slug === slug);
    if (!region) return null;
    return region.countries.slice();
  }

  getCountriesBySubregion(subregionNameOrSlug) {
    const slug = slugify(subregionNameOrSlug);
    const subregion = this.subregions.find(s => s.slug === slug);
    if (!subregion) return null;
    return subregion.countries.slice();
  }

  getRegionByCountry(CountryNameSlugOrCode) {
    const code = this.getCountryCode(CountryNameSlugOrCode) ||
      this.getCountryCode(this.getCountrySlug(CountryNameSlugOrCode));
    return this.regions
      .find(r => r.countries.filter(c => c.code === code).length > 0);
  }

  getSubregionByCountry(CountryNameSlugOrCode) {
    const code = this.getCountryCode(CountryNameSlugOrCode) ||
      this.getCountryCode(this.getCountrySlug(CountryNameSlugOrCode));
    return this.subregions
      .find(r => r.countries.filter(c => c.code === code).length > 0);
  }
}

export default CovidMetadataClient;
