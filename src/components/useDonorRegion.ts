import { useEffect, useState } from 'react';
import useViewerGeo from './useViewerGeo';
import { getCountries } from 'libphonenumber-js';

const KEY = 'bloodnet_donor_country_v1';
const EVENT = 'bloodnet-donor-country';
// Pin display names across Node/browser ICU versions to keep hydration stable.
import countryNames from '../lib/countryNames.json';
export const DONOR_COUNTRIES = getCountries().map(code => countryNames[code] || code).sort((a,b) => a < b ? -1 : a > b ? 1 : 0);

export default function useDonorRegion(forcedCountry?: string) {
  const geo = useViewerGeo();
  const [chosen, setChosen] = useState('');
  useEffect(() => {
    const read = () => {
      try {
        const value = localStorage.getItem(KEY) || '';
        setChosen(DONOR_COUNTRIES.includes(value) ? value : '');
      } catch { /* Country selection still works without browser storage. */ }
    };
    const changed = (event: Event) => setChosen((event as CustomEvent<string>).detail);
    read();
    window.addEventListener(EVENT, changed);
    window.addEventListener('storage', read);
    return () => { window.removeEventListener(EVENT, changed); window.removeEventListener('storage', read); };
  }, []);
  const chooseCountry = (country: string) => {
    setChosen(country);
    try { localStorage.setItem(KEY, country); } catch { /* Keep the in-memory choice. */ }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: country }));
  };
  const country = forcedCountry || chosen || geo.country || '';
  const confirmLocation=async()=>{const confirmed=await geo.requestPreciseLocation();if(confirmed?.country&&!forcedCountry)chooseCountry(confirmed.country);};
  return { country, city: country === geo.country ? geo.city : undefined, lat:country===geo.country?geo.lat:undefined, lng:country===geo.country?geo.lng:undefined, resolved:Boolean(country)||geo.resolved, chooseCountry, confirmLocation, locating:geo.locating, locationMessage:geo.locationMessage };
}
