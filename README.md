![](badge.svg)

# graphics-atlas-client

[![npm version](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client.svg)](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client)

Global country metadata client, based on the [International Organization for Standardization 3166 Country Codes](https://www.iso.org/iso-3166-country-codes.html). Includes translations for country and UN region names in German, French, Italian, Spanish, Portuguese, Japanese, Chinese and Persian/Fārsī.

TopoJSON geometry (country **polygons** and border **lines**, at `low`/`medium`/`high` detail) is published separately as [`@reuters-graphics/graphics-atlas-topojson`](https://github.com/reuters-graphics/graphics-atlas-topojson) and fetched on demand from the CDN via this client's `fetch*` methods — so installing the client stays lightweight.

### Install

```
$ pnpm add @reuters-graphics/graphics-atlas-client
```

### Use the metadata client

```javascript
import AtlasMetadataClient from '@reuters-graphics/graphics-atlas-client';

const client = new AtlasMetadataClient();

client.regions;
// [
//   {
//     name: 'Asia',
//     slug: 'asia',
//     translations: {
//       de: 'Asien',
//       en: 'Asia',
//       ...
//     },
//     subregions: [{}, {}],
//     countries: [{}, {}],
//   }
//   ...
// ]

client.getRegion('Northern America'); // Region name or slug

client.getRegionSlug('Northern America');
// 'northern-america'
client.getRegionName('northern-america');
// 'Northern America'

client.getRegionByCountry('China'); // Country name, slug or code
// {
//   name: 'Asia',
//   slug: 'asia',
//   translations: {},
//   subregions: [{}, {}],
//   countries: [{}, {}],
// }


client.subregions;
// [
//   {
//     name: 'Middle Africa',
//     slug: 'middle-africa',
//     region: {},
//     countries: [{}, {}],
//   }
//   ...
// ]

client.getSubregionSlug('Middle Africa');
// 'middle-africa'
client.getSubregionName('middle-africa');
// 'Middle Africa'

client.getSubregionByCountry('DE');
// {
//   name: 'Western Europe',
//   slug: 'western-europe',
//   region: {},
//   countries: [{}, {}],
// }

client.countries;
// [
//   {
//     name: 'United Kingdom',
//     slug: 'united-kingdom',
//     isoAlpha2: 'GB',
//     isoAlpha3: 'GBR',
//     isoNumeric: '826',
//     translations: {
//       de: 'Vereinigtes Königreich',
//       en: 'United Kingdom',
//       ...
//     },
//     abbreviations: {
//       en: 'U.K.',
//     },
//     dataProfile: {
//       population: {},
//     },
//     region: {},
//     subregion: {},
//   }
//   ...
// ]

client.getCountry('GB') // Country name, slug or code
// {
//   name: 'United Kingdom',
//   slug: 'united-kingdom',
//   isoAlpha2: 'GB',
//   isoAlpha3: 'GBR',
//   isoNumeric: '826',
//   translations: {
//     de: 'Vereinigtes Königreich',
//     en: 'United Kingdom',
//     ...
//   },
//   abbreviations: {
//     en: 'U.K.',
//   },
//   region: {},
//   subregion: {},
// }

client.getCountriesByRegion('Asia');
client.getCountriesBySubregion('Western Europe');

client.getCountrySlug('Ireland'); // Country name or code
// 'ireland'
client.getCountryName('IRL'); // Country slug or code
// 'Ireland'
```


**Note:** Metadata does not include countries which are not assigned a code by the International Organization for Standardization. These include:

- Kosovo
- Northern Cyprus
- Channel Islands

### Use the TopoJSON

#### Import

TopoJSON is no longer bundled in this package — it lives in [`@reuters-graphics/graphics-atlas-topojson`](https://github.com/reuters-graphics/graphics-atlas-topojson). Use the `fetch*` methods below, or read files directly from that package/CDN. Layout:

```
topojson/polygons/{low,medium,high}/{world,<region-slug>,<subregion-slug>,<ISO2>}.json
topojson/lines/{low,medium,high}/{world,<un-region-slug>}.json   # border lines w/ `disputed` flag
```

#### Fetch from client

```javascript
import AtlasMetadataClient from '@reuters-graphics/graphics-atlas-client';

const client = new AtlasMetadataClient();

// Country / region / subregion / world POLYGONS, at an optional detail level
// ('low' | 'medium' | 'high', default 'medium').
client.fetchCountryTopojson('germany', 'high').then((topojson) => { ... });
client.fetchRegionTopojson('Africa').then((topojson) => { ... });
client.fetchSubregionTopojson('Western Europe').then((topojson) => { ... });
client.fetchGlobalTopojson('low').then((topojson) => { ... });

// Border LINES (carry a `disputed` flag) — world + UN region only.
client.fetchGlobalLines().then((topojson) => { ... });
client.fetchRegionLines('Europe', 'high').then((topojson) => { ... });
```

#### Fetch from CDN

```javascript
fetch('https://cdn.jsdelivr.net/npm/@reuters-graphics/graphics-atlas-topojson@latest/topojson/polygons/medium/world.json')
  .then(res => res.json())
  .then((topology) => {
    console.log(topology);
  });
```

### Building data

```
$ pnpm build:metadata   # regenerate lib/data/metadata.json
$ pnpm build            # bundle the client (CJS + ESM)
```

TopoJSON map generation lives in the separate [`graphics-atlas-topojson`](https://github.com/reuters-graphics/graphics-atlas-topojson) repo.

### Centroids

Each country carries a `coordinates` field — `[longitude, latitude]` (GeoJSON order) — on its metadata (not on the geometry). Values are editable in `data/centroids.csv` and applied by `pnpm build:metadata`.

### Docs & live test

A self-contained page at [`docs/index.html`](docs/index.html) loads the built client, runs a set of smoke-test assertions, and renders live maps (country polygons + world borders with disputed styling) fetched from the CDN — handy for manually verifying a build.

```
$ pnpm docs      # builds, then serves at http://localhost:8000 — open /docs/
```

### Data sources

- Country/border geometry: [`graphics-atlas-topojson`](https://github.com/reuters-graphics/graphics-atlas-topojson), built from [`country-borders`](https://github.com/reuters-graphics/country-borders) ([Overture Maps](https://overturemaps.org/), ODbL — © OpenStreetMap contributors, Overture Maps Foundation)
- Population: [World Bank](https://data.worldbank.org/indicator/SP.POP.TOTL) (SP.POP.TOTL)
- Income classification: [World Bank](https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups)
- Translations: [Umpirsky country list](https://github.com/umpirsky/country-list)
