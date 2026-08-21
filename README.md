![](badge.svg)

# graphics-atlas-client

[![npm version](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client.svg)](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client)

Global country **metadata** ([ISO 3166](https://www.iso.org/iso-3166-country-codes.html)) — names, translations (8 languages), ISO codes, `[lon, lat]` centroids, population, GDP and income group — plus **TopoJSON** country polygons and border lines at three detail levels. Zero runtime dependencies, dual ESM + CommonJS.

📖 **[Full documentation & interactive explorer →](https://reuters-graphics.github.io/graphics-atlas-client/)**

## Install

```bash
pnpm add @reuters-graphics/graphics-atlas-client
```

## Quick start

### Metadata

```javascript
import AtlasMetadataClient from '@reuters-graphics/graphics-atlas-client';

const client = new AtlasMetadataClient();

client.getCountry('DE');              // by ISO alpha-2/alpha-3/numeric, name or slug
client.getRegion('Europe');
client.getSubregion('Western Europe');
client.getRegionByCountry('France');
client.getCountriesByRegion('Africa');

client.countries;                     // all 249
client.regions;                       // 6 UN regions
client.subregions;                    // 22 subregions
```

Lookups are case-insensitive; not-found returns `null`. Each country carries `translations`, `abbreviations`, `coordinates` (`[lon, lat]`) and a `dataProfile` (population, GDP, income group). Full reference: [metadata docs](https://reuters-graphics.github.io/graphics-atlas-client/metadata/).

> Only ISO 3166-assigned countries are included — so Kosovo, Northern Cyprus and the Channel Islands are not.

### Maps (TopoJSON)

Country **polygons** and border **lines** at `low` / `medium` / `high` detail. Fetch from the CDN at runtime, or import a file directly for a tree-shakeable local bundle.

```javascript
// Fetch on demand — nothing bundled
await client.fetchCountryTopojson('germany', 'high');
await client.fetchGlobalTopojson('low');
await client.fetchRegionLines('Europe');   // border lines carry a `disputed` flag

// Or import one file — bundler ships only this one
import de from '@reuters-graphics/graphics-atlas-client/topojson/polygons/high/DE.json';
```

Full file layout and both approaches: [TopoJSON docs](https://reuters-graphics.github.io/graphics-atlas-client/topojson/).

### Flags

Flags come from [`flag-icons`](https://github.com/lipis/flag-icons); the client only builds URLs and class names — nothing is bundled.

```javascript
const { svg, className } = client.getCountryFlag('DE');
// svg['4x3'] → CDN SVG URL;  className → 'fi fi-de' (needs flag-icons CSS)

client.getFlag('scotland');   // non-country flags (eu, un, gb-sct, …) resolve too
```

Returns `null` for unrecognized input. `flag-icons` is an optional peer dependency — only needed for the CSS-class approach.

## Contributing

Development uses **Node 22** (`.nvmrc`) and **pnpm** (via Corepack). CI runs on every push.

```bash
nvm use            # Node 22
corepack enable    # pinned pnpm
pnpm install
pnpm build         # bundle the client (CJS + ESM)
pnpm lint
pnpm test          # unit tests (network-free)
```

The published package targets Node `>=18`; Node 22 is the dev/CI baseline.

### Regenerating data

```bash
pnpm build:metadata   # rebuild lib/data/metadata.json (centroids from data/centroids.csv)
pnpm build:maps       # rebuild topojson/ from country-borders (needs authenticated `gh`)
```

Map generation lives in [`bin/buildMaps/`](bin/buildMaps/): it downloads the pinned [`country-borders`](https://github.com/reuters-graphics/country-borders) GeoJSON (a private repo, so `gh` must be authenticated), then cuts and quantizes polygons + lines at three scales into `topojson/`. The source commit is pinned in `input/.country-borders-sha` for reproducible builds; pass `{ force: true }` to `fetchInput` to re-pin to the latest `country-borders`. `topojson/` is regenerated fresh at publish (`prepublishOnly`) and is not committed to git.

### Docs site

An [Astro Starlight](https://starlight.astro.build/) site in [`docs/`](docs/), deployed to [GitHub Pages](https://reuters-graphics.github.io/graphics-atlas-client/) on push to `master`.

```bash
pnpm docs:dev      # run locally — served under /graphics-atlas-client/
pnpm docs:build    # build client + docs
```

## Data sources

- Geometry: [`country-borders`](https://github.com/reuters-graphics/country-borders) — [Overture Maps](https://overturemaps.org/) (ODbL, © OpenStreetMap contributors, Overture Maps Foundation)
- Population: [World Bank](https://data.worldbank.org/indicator/SP.POP.TOTL) (SP.POP.TOTL)
- GDP: [World Bank](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD) (NY.GDP.MKTP.CD, current US$)
- Income group: [World Bank](https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups)
- Translations: [umpirsky/country-list](https://github.com/umpirsky/country-list)

## License

MIT
