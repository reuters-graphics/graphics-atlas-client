![](badge.svg)

# graphics-atlas-client

[![npm version](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client.svg)](https://badge.fury.io/js/%40reuters-graphics%2Fgraphics-atlas-client)

Global country metadata client, based on the [International Organization for Standardization 3166 Country Codes](https://www.iso.org/iso-3166-country-codes.html). Includes translations for country names in German, French, Italian, Spanish, Portuguese, Japanese, Chinese and Persian/Fārsī.

Also includes a complete repository of topojson files for countries and UN regions and sub-regions at 1:50m and 1:110m resolution.

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
//     subregions: [{}, {}],
//     countries: [{}, {}],
//   }
//   ...
// ]

client.getRegionSlug('Northern America');
// 'northern-america'
client.getRegionName('northern-america');
// 'Northern America'

client.getRegionByCountry('China'); // Country name, slug or code
// {
//   name: 'Asia',
//   slug: 'asia',
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
//     }
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
//   }
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

```javascript
// Use a country's ISO alpha 2 code and the resolution level
// 1:50m Germany
import topology from '@reuters-graphics/graphics-atlas-client/topojson/DE.50m.json';
// 1:110m Germany
import topology from '@reuters-graphics/graphics-atlas-client/topojson/DE.110m.json';

// Use a UN region or sub-region's slug to get a collection of countries
// 1:50m Africa
import topology from '@reuters-graphics/graphics-atlas-client/topojson/africa.50m.json';
// 1:110m Central America
import topology from '@reuters-graphics/graphics-atlas-client/topojson/central-america.110m.json';
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

- [World Atlas TopoJSON](https://github.com/topojson/world-atlas)
- [Umpirsky country list](https://github.com/umpirsky/country-list)
