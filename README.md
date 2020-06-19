![](badge.svg)

# graphics-atlas-client

Global country metadata client, based on the [International Organization for Standardization 3166 Country Codes](https://www.iso.org/iso-3166-country-codes.html).

Includes translations for country names in German, French, Italian, Spanish, Japanese, Chinese and Persian/Fārsī.

### Install

```
$ yarn add @reuters-graphics/graphics-atlas-client
```

### Use

```javascript
import AtlasClient from '@reuters-graphics/graphics-atlas-client';

const client = new AtlasClient();

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
