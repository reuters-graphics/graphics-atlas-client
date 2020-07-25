![](badge.svg)

# graphics-atlas-client

[![npm version](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client.svg)](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client)

Global country metadata client, based on the [International Organization for Standardization 3166 Country Codes](https://www.iso.org/iso-3166-country-codes.html). Includes translations for country and UN region names in German, French, Italian, Spanish, Portuguese, Japanese, Chinese and Persian/Fārsī.

Also includes a complete repository of topojson files for countries and UN regions and sub-regions.

### Install

```
$ yarn add @reuters-graphics/graphics-atlas-client
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

```javascript
// Use a country's ISO alpha 2 code
// Germany
import topology from '@reuters-graphics/graphics-atlas-client/topojson/DE.json';

// Use a UN region or sub-region's slug to get a collection of countries
// Africa
import topology from '@reuters-graphics/graphics-atlas-client/topojson/africa.json';
// Central America
import topology from '@reuters-graphics/graphics-atlas-client/topojson/central-america.json';

// World includes all countries and disputed boundaries
import topology from '@reuters-graphics/graphics-atlas-client/topojson/world.json';
```

#### Fetch from client

```javascript
import AtlasMetadataClient from '@reuters-graphics/graphics-atlas-client';

const client = new AtlasMetadataClient();

// Use a country's name, slug or ISO code
client.fetchCountryTopojson('germany')
  .then((topojson) => { ... });

// Use a UN region or sub-region's name or slug to get a collection of countries
client.fetchRegionTopojson('Africa')
  .then((topojson) => { ... });

// Get the world topojson
client.fetchGlobalTopojson()
  .then((topojson) => { ... });
```

#### Fetch from CDN

```javascript
fetch('https://cdn.jsdelivr.net/npm/@reuters-graphics/graphics-atlas-client@latest/topojson/world.json')
  .then(res => res.json())
  .then((topology) => {
    console.log(topology);
  });
```

### Building data

```
$ yarn build:metadata
$ yarn build
$ yarn build:maps
```

### Centroids

Centroids for each country are automatically calculated and added to the properties of each country's topojson. You can override the default calculation by adding a custom centroid to the `data/custom_centroids.csv` file and rebuilding the maps.

### Data sources

- [GADM](https://gadm.org/index.html)
- [Stanford World Boundaries of Disputed Areas](https://purl.stanford.edu/tq310nc7616)
- [Umpirsky country list](https://github.com/umpirsky/country-list)
