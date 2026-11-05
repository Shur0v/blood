'use client';
import {useState} from 'react';
import Hero from '../Hero';
import type {UsaArea,UsaConfig} from '@/src/lib/usaEdition';
export default function UsaDiscovery({area,heading,description,sections}:{area?:UsaArea;heading?:string;description?:string;sections?:UsaConfig['sections']}){
 const [city,setCity]=useState(area?.kind==='city'?area.directoryCities[0]:area?.directoryCities[0]||'');
 return <div className={'us-discovery us-discovery-'+(sections?.search?.variant||'default')}>{area?.kind==='state'&&<label className="us-state-picker">Search a mapped city in {area.name}<select value={city} onChange={e=>setCity(e.target.value)}>{area.directoryCities.map(name=><option key={name}>{name}</option>)}</select><span>This selector searches one city at a time; broader suggestions retain their actual location.</span></label>}<Hero key={city} forcedCountry="United States" initialCity={city} presentation="regional" regionalSections headingLevel={2} contentOverride={{heading:heading||'Find a local starting point.',description:description||'Explore recorded people and organization contacts. Check the source and location on each card, then confirm the next step directly.'}} usaEdition usaResults={sections?.results}/></div>;
}
