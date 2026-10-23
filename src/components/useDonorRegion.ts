import { useEffect, useState } from 'react';
import useViewerGeo from './useViewerGeo';
import useDonorCountries from './useDonorCountries';

const KEY = 'bloodnet_donor_country_v1';
const EVENT = 'bloodnet-donor-country';

export default function useDonorRegion(forcedCountry?: string) {
  const geo = useViewerGeo();
  const coverage = useDonorCountries();
  const [chosen, setChosen] = useState('');
  useEffect(() => {
    const read = () => {
      try {
        const value = localStorage.getItem(KEY) || '';
        setChosen(value);
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
  useEffect(()=>{
    if(coverage.loaded&&chosen&&!coverage.countries.includes(chosen)){
      setChosen('');
      try{if(localStorage.getItem(KEY)===chosen)localStorage.removeItem(KEY);}catch{}
      window.dispatchEvent(new CustomEvent(EVENT,{detail:''}));
    }
  },[coverage.loaded,coverage.countries,chosen]);
  const validChoice=chosen&&(!coverage.loaded||coverage.countries.includes(chosen))?chosen:'';
  const country = forcedCountry || validChoice || geo.country || '';
  const confirmLocation=async()=>{const confirmed=await geo.requestPreciseLocation();if(confirmed?.country&&!forcedCountry)chooseCountry(confirmed.country);};
  return { country, city: country === geo.country ? geo.city : undefined, lat:country===geo.country?geo.lat:undefined, lng:country===geo.country?geo.lng:undefined, resolved:Boolean(country)||geo.resolved, chooseCountry, confirmLocation, locating:geo.locating, locationMessage:geo.locationMessage };
}
