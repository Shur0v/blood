import {toLocationSlug} from '@/src/backend/utils/locationSlug';
import {countryToShortcut} from './seoRouting';
import {REGIONS} from './regions';

export function getRegionalEdition(country:string){
 const countrySlug=toLocationSlug(country);
 const primary=REGIONS.find(region=>region.country.toLowerCase()===country.trim().toLowerCase());
 const shortcut=countryToShortcut(country);
 const coveragePath=`/network/${countrySlug}`;
 return {
  countrySlug,
  theme:['nepal','india','pakistan','bangladesh'].includes(countrySlug)?countrySlug:'international',
  countryPath:primary?`/${primary.slug}`:shortcut?`/${shortcut}`:coveragePath,
  coveragePath,
 };
}
