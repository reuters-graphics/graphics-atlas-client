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

### Flags

Country flags come from [`flag-icons`](https://github.com/lipis/flag-icons) (pure SVG + CSS, keyed on ISO 3166-1 alpha-2). The client only generates URLs/class names — it doesn't bundle the flags — so there's nothing extra to install for the SVG approach.

```javascript
client.getCountryFlag('Germany');
// {
//   code: 'de',
//   className: 'fi fi-de',            // for a <span> with flag-icons CSS
//   squareClassName: 'fi fi-de fis',
//   svg: {
//     '4x3': 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/flags/4x3/de.svg',
//     '1x1': 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/flags/1x1/de.svg',
//   },
// }
```

Zero-dependency SVG (just an `<img>`):

```javascript
const { svg } = client.getCountryFlag('DE');
// <img src={svg['4x3']} alt="Germany flag" />
```

CSS-class approach (install `flag-icons` — an optional peer dependency — or link its CDN CSS):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/css/flag-icons.min.css" />
<span class="fi fi-de"></span>
```

#### Non-country flags

`flag-icons` also ships flags that aren't ISO countries — organizations (`eu`, `un`), UK nations (`gb-sct`, `gb-eng`…), Spanish regions, territories and specials (`xk` Kosovo, `xx` unknown). These are kept in a maintained list and resolved via `getFlag()` by code, slug or name (case-insensitive):

```javascript
client.getFlag('scotland');        // { code: 'gb-sct', className: 'fi fi-gb-sct', ... }
client.getFlag('european-union');  // { code: 'eu', ... }
client.getFlag('Germany');         // ISO countries resolve too -> { code: 'de', ... }

client.customFlags;                // the full maintained list [{ code, name, slug, category }, …]
```

`getCountryFlag()` / `getFlag()` return `null` for unrecognized input.

### Development

Development uses **Node 22** (see `.nvmrc`) and **pnpm** (via Corepack). CI runs on every push.

```
$ nvm use            # Node 22, from .nvmrc
$ corepack enable    # activates the pinned pnpm
$ pnpm install
$ pnpm build         # bundle (CJS + ESM)
$ pnpm lint
$ pnpm test          # unit tests (network-free)
```

The published package targets Node `>=18`; Node 22 is a dev/CI baseline only.

### Building data

```
$ pnpm build:metadata   # regenerate lib/data/metadata.json
$ pnpm build            # bundle the client (CJS + ESM)
```

TopoJSON map generation lives in the separate [`graphics-atlas-topojson`](https://github.com/reuters-graphics/graphics-atlas-topojson) repo.

### Centroids

Each country carries a `coordinates` field — `[longitude, latitude]` (GeoJSON order) — on its metadata (not on the geometry). Values are editable in `data/centroids.csv` and applied by `pnpm build:metadata`.

### Docs &amp; demo

Documentation is an [Astro Starlight](https://starlight.astro.build/) site in [`docs/`](docs/), published to [**GitHub Pages**](https://reuters-graphics.github.io/graphics-atlas-client/) (auto-deployed on push to `master`). It includes an interactive **Explorer** — pick a country or the world, slide the detail level, inspect and copy the metadata, and download the TopoJSON shapes.

```
$ pnpm docs:dev      # run the docs site locally (astro dev)
$ pnpm docs:build    # build the client + docs site
```

### Data sources

- Country/border geometry: [`graphics-atlas-topojson`](https://github.com/reuters-graphics/graphics-atlas-topojson), built from [`country-borders`](https://github.com/reuters-graphics/country-borders) ([Overture Maps](https://overturemaps.org/), ODbL — © OpenStreetMap contributors, Overture Maps Foundation)
- Population: [World Bank](https://data.worldbank.org/indicator/SP.POP.TOTL) (SP.POP.TOTL)
- Income classification: [World Bank](https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups)
- Translations: [Umpirsky country list](https://github.com/umpirsky/country-list)
