![](badge.svg)

# covid-metadata-client


### Methods

```javascript
import CovidMetadataClient from '@reuters-graphics/covid-metadata-client';

const client = new CovidMetadataClient();

client.regions;

client.getRegionSlug(regionName);
client.getRegionName(regionSlug);
client.getRegionByCountry(CountryNameSlugOrCode);


client.subregions;

client.getSubregionSlug(subregionName);
client.getSubregionName(subregionSlug);
client.getSubregionByCountry(CountryNameSlugOrCode);

client.countries;

client.getCountriesByRegion(regionNameOrSlug);
client.getCountriesBySubregion(subregionNameOrSlug);

client.getCountrySlug(countryNameOrCode);
client.getCountryCode(countrySlugOrName);
client.getCountryName(countrySlugOrCode);




```
