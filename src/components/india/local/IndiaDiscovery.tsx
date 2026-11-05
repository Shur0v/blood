'use client';
import {useState} from 'react';
import Hero from '../../Hero';
import CityLandingDonorGrid from '../../CityLandingDonorGrid';
import OrganHero from '../../OrganHero';
import {INDIA_CITIES,type IndiaArea,type IndiaConfig} from '@/src/lib/indiaLocal';
export default function IndiaDiscovery({area,initialCity,group,organ,mode,sections}:{area:IndiaArea;initialCity?:string;group?:string;organ?:string;mode:'blood'|'organ';sections?:IndiaConfig['sections']}){
 const choices=area.kind==='state'?INDIA_CITIES.filter(a=>a.stateId===area.id):[];
 const [city,setCity]=useState(initialCity||choices[0]?.aliases[0]||area.name);
 return <div className={'in-discovery in-treatment-'+(sections?.search?.variant||'default')}>
 {area.kind==='state'&&!initialCity&&<label className="in-state-search">Choose a reviewed city in {area.name}<select value={city} onChange={e=>setCity(e.target.value)}>{choices.map(a=><option value={a.aliases[0]} key={a.id}>{a.name}</option>)}</select><span>The search shows one city at a time. State totals describe reviewed mappings, not all of the displayed broader suggestions.</span></label>}
 {mode==='blood'?<Hero key={city} forcedCountry="India" initialCity={city} initialGroup={group||null} presentation="regional" regionalSections headingLevel={2} indiaLocal usaResults={sections?.results} contentOverride={{heading:sections?.search?.title||'Find a useful local contact.',description:sections?.search?.text||'Start with the collecting city and requested blood group. Read each result’s source and location, then confirm the next step directly.'}}/>:<section data-india-component="search" id="regional-donor-search"><header className="in-organ-search"><h2>{sections?.search?.title||`Recorded organ pledges in ${city}`}</h2><p>{sections?.search?.text||"These entries express willingness, not available organs or confirmed clinical matches. Use authorized transplant services for medical coordination."}</p></header><div data-india-component="results" data-india-result-variant={sections?.results?.variant}>{(sections?.results?.title||sections?.results?.text)&&<header className="in-results-heading">{sections.results.title&&<h2>{sections.results.title}</h2>}{sections.results.text&&<p>{sections.results.text}</p>}</header>}{organ?<OrganHero headingLevel={2} initialOrgan={organ} initialCity={city} forcedCountry="India" heading={organ+' pledges in '+city} description="Use authorized transplant services for clinical coordination."/>:<CityLandingDonorGrid key={city} mode="organ" country="India" city={city}/>}</div></section>}
 </div>;
}
