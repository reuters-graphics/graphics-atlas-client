import metadata from './data/metadata.json';

// Dedupe by a key (property name or accessor fn), keeping first occurrence.
const uniqBy = (arr, key) => {
  const accessor = typeof key === 'function' ? key : (item) => item[key];
  const seen = new Set();
  return arr.filter((item) => {
    const k = accessor(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// TopoJSON assets live in a separate, independently-versioned package
// (@reuters-graphics/graphics-atlas-topojson), served over the jsDelivr CDN at
// a pinned version so geometry can't drift from the client. Bump TOPOJSON_VERSION
// when a new assets release should be adopted. (see #31)
const TOPOJSON_PKG = '@reuters-graphics/graphics-atlas-topojson';
const TOPOJSON_VERSION = '0.1.0';
const FETCH_BASE = `https://cdn.jsdelivr.net/npm/${TOPOJSON_PKG}@${TOPOJSON_VERSION}`;

// Cartographic detail levels (replaces the old .50m/.110m scheme). Coarser
// levels omit the smallest geographies (source has no geometry there) — the
// fetchers surface a clear error rather than falling back.
const DETAILS = ['low', 'medium', 'high'];
const DEFAULT_DETAIL = 'medium';

const norm = (v) => (v === null || v === undefined ? null : String(v).toLowerCase());

const pickCountry = (c) => ({
  name: c.name,
  slug: c.slug,
  isoAlpha2: c.isoAlpha2,
  isoAlpha3: c.isoAlpha3,
  isoNumeric: c.isoNumeric,
  translations: c.translations,
  abbreviations: c.abbreviations,
  dataProfile: c.dataProfile,
});

class MetadataClient {
  constructor() {
    this._metadata = metadata;
    this._cache = null;
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(metadata) {
    this._metadata = metadata;
    this._cache = null;
  }

  // Builds the computed collections and lookup indexes once, lazily.
  // Invalidated whenever `metadata` is replaced via the setter.
  _getCache() {
    if (this._cache) return this._cache;

    const md = this._metadata;

    const countries = md.map(c => ({
      ...pickCountry(c),
      region: c.unRegion,
      subregion: c.unSubregion,
    }));

    const regionSeeds = uniqBy(md.filter(c => c.unRegion).map(c => c.unRegion), d => d.name);
    const regions = regionSeeds.map(region => ({
      ...region,
      subregions: uniqBy(
        md.filter(c => c.unRegion && c.unRegion.name === region.name).map(c => c.unSubregion),
        d => d.name
      ),
      countries: md
        .filter(c => c.unRegion && c.unRegion.name === region.name)
        .map(pickCountry),
    }));

    const subregionSeeds = uniqBy(
      md.filter(c => !!c.unSubregion).map(c => ({
        name: c.unSubregion.name,
        slug: c.unSubregion.slug,
        region: c.unRegion,
      })),
      'name'
    );
    const subregions = subregionSeeds.map(({ name, slug, region }) => ({
      name,
      slug,
      region,
      countries: md
        .filter(c => c.unSubregion && c.unSubregion.name === name)
        .map(pickCountry),
    }));

    // Normalized (lowercased) lookup indexes for O(1), case-insensitive resolution.
    const bySlug = new Map();
    const byName = new Map();
    const byCode = new Map();
    countries.forEach((c) => {
      if (c.slug) bySlug.set(norm(c.slug), c);
      if (c.name) byName.set(norm(c.name), c);
      [c.isoAlpha2, c.isoAlpha3, c.isoNumeric].forEach((code) => {
        if (code) byCode.set(norm(code), c);
      });
    });

    const regionByKey = new Map();
    const subregionByKey = new Map();
    const regionByCountrySlug = new Map();
    const subregionByCountrySlug = new Map();
    regions.forEach((r) => {
      regionByKey.set(norm(r.slug), r);
      regionByKey.set(norm(r.name), r);
      r.countries.forEach(c => regionByCountrySlug.set(c.slug, r));
    });
    subregions.forEach((s) => {
      subregionByKey.set(norm(s.slug), s);
      subregionByKey.set(norm(s.name), s);
      s.countries.forEach(c => subregionByCountrySlug.set(c.slug, s));
    });

    this._cache = {
      countries,
      regions,
      subregions,
      bySlug,
      byName,
      byCode,
      regionByKey,
      subregionByKey,
      regionByCountrySlug,
      subregionByCountrySlug,
    };
    return this._cache;
  }

  get regions() {
    return this._getCache().regions;
  }

  getRegion(regionNameOrSlug) {
    return this._getCache().regionByKey.get(norm(regionNameOrSlug)) || null;
  }

  getRegionSlug(regionName) {
    const region = this.getRegion(regionName);
    if (!region) return null;
    return region.slug;
  }

  getRegionName(regionSlug) {
    const region = this.getRegion(regionSlug);
    if (!region) return null;
    return region.name;
  }

  get subregions() {
    return this._getCache().subregions;
  }

  getSubregion(subregionNameOrSlug) {
    return this._getCache().subregionByKey.get(norm(subregionNameOrSlug)) || null;
  }

  getSubregionSlug(subregionName) {
    const subregion = this.getSubregion(subregionName);
    if (!subregion) return null;
    return subregion.slug;
  }

  getSubregionName(subregionSlug) {
    const subregion = this.getSubregion(subregionSlug);
    if (!subregion) return null;
    return subregion.name;
  }

  get countries() {
    return this._getCache().countries;
  }

  getCountry(nameSlugOrCode) {
    const key = norm(nameSlugOrCode);
    if (key === null) return null;
    const cache = this._getCache();
    return (
      cache.bySlug.get(key) ||
      cache.byName.get(key) ||
      cache.byCode.get(key) ||
      null
    );
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
    const region = this.getRegion(nameOrSlug);
    if (!region) return null;
    return region.countries.slice();
  }

  getCountriesBySubregion(nameOrSlug) {
    const subregion = this.getSubregion(nameOrSlug);
    if (!subregion) return null;
    return subregion.countries.slice();
  }

  getRegionByCountry(nameSlugOrCode) {
    const country = this.getCountry(nameSlugOrCode);
    if (!country) return null;
    return this._getCache().regionByCountrySlug.get(country.slug) || null;
  }

  getSubregionByCountry(nameSlugOrCode) {
    const country = this.getCountry(nameSlugOrCode);
    if (!country) return null;
    return this._getCache().subregionByCountrySlug.get(country.slug) || null;
  }

  // Data fetchers — country POLYGONS (land fill), per geography, at a detail level.
  async fetchGlobalTopojson(detail = DEFAULT_DETAIL) {
    return this._fetchTopojson('polygons', 'world', detail);
  }

  async fetchRegionTopojson(regionNameOrSlug, detail = DEFAULT_DETAIL) {
    const region = this.getRegion(regionNameOrSlug);
    if (!region) throw new Error(`No region found for: ${regionNameOrSlug}`);
    return this._fetchTopojson('polygons', region.slug, detail);
  }

  async fetchSubregionTopojson(subregionNameOrSlug, detail = DEFAULT_DETAIL) {
    const subregion = this.getSubregion(subregionNameOrSlug);
    if (!subregion) throw new Error(`No subregion found for: ${subregionNameOrSlug}`);
    return this._fetchTopojson('polygons', subregion.slug, detail);
  }

  async fetchCountryTopojson(nameSlugOrCode, detail = DEFAULT_DETAIL) {
    const country = this.getCountry(nameSlugOrCode);
    if (!country) throw new Error(`No country found for: ${nameSlugOrCode}`);
    return this._fetchTopojson('polygons', country.isoAlpha2, detail);
  }

  // Border LINES (stroke), carrying a `disputed` flag. Published only at the
  // world and UN-region level (borders are shared; no per-country/subregion lines).
  async fetchGlobalLines(detail = DEFAULT_DETAIL) {
    return this._fetchTopojson('lines', 'world', detail);
  }

  async fetchRegionLines(regionNameOrSlug, detail = DEFAULT_DETAIL) {
    const region = this.getRegion(regionNameOrSlug);
    if (!region) throw new Error(`No region found for: ${regionNameOrSlug}`);
    return this._fetchTopojson('lines', region.slug, detail);
  }

  async _fetchTopojson(type, key, detail) {
    if (!DETAILS.includes(detail)) {
      throw new Error(`Invalid detail "${detail}". Use one of: ${DETAILS.join(', ')}`);
    }
    const path = `/topojson/${type}/${detail}/${key}.json`;
    const response = await fetch(FETCH_BASE + path);
    if (!response.ok) {
      throw new Error(`Failed to fetch topojson (${response.status}) from ${FETCH_BASE + path}`);
    }
    return response.json();
  }
}

export default MetadataClient;
