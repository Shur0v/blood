'use client';
import {useState} from 'react';
import Hero from '../../Hero';
import CityLandingDonorGrid from '../../CityLandingDonorGrid';
import OrganHero from '../../OrganHero';
import {PAKISTAN_CITIES,type PakistanArea,type PakistanConfig} from '@/src/lib/pakistanLocal';
import {formatRegionalText} from '@/src/lib/regionalDesign';
export default function PakistanDiscovery({area,initialCity,group,organ,mode,sections}:{area:PakistanArea;initialCity?:string;group?:string;organ?:string;mode:'blood'|'organ';sections?:PakistanConfig['sections']}){
 const choices=area.kind==='region'?PAKISTAN_CITIES.filter(a=>a.regionId===area.id):[];
 const [city,setCity]=useState(initialCity||choices[0]?.aliases[0]||area.name);
 const text=(value:string)=>formatRegionalText(value.replaceAll('{place}',area.name),{country:'Pakistan',city,group});
 const results=sections?.results?{...sections.results,title:sections.results.title?text(sections.results.title):undefined,text:sections.results.text?text(sections.results.text):undefined}:undefined;
 return <div className={'pl-discovery pl-treatment-'+(sections?.search?.variant||'default')}>
 {area.kind==='region'&&!initialCity&&<div className="pl-city-picker"><span className="pl-number">02</span><label>Choose a reviewed city in {area.name}<select value={city} onChange={e=>setCity(e.target.value)}>{choices.map(a=><option value={a.aliases[0]} key={a.id}>{a.name}</option>)}</select></label><p>Regional figures cover reviewed mappings. The working search below shows one city at a time, with any broader suggestions labelled by their own location.</p></div>}
 {mode==='blood'?<Hero key={city} forcedCountry="Pakistan" initialCity={city} initialGroup={group||null} presentation="regional" regionalSections headingLevel={2} pakistanLocal pakistanResults={results} contentOverride={{heading:text(sections?.search?.title||'A clearer search. A useful starting point.'),description:text(sections?.search?.text||'Choose the requested group and collecting city. Read each contact’s source and actual location before arranging the next step.')}}/>:<section data-pakistan-component="search" id="regional-donor-search"><header className="pl-organ-search"><h2>{text(sections?.search?.title||`Recorded organ pledges in ${city}`)}</h2><p>{text(sections?.search?.text||'A pledge expresses willingness, not available organs or a confirmed clinical match. Follow authorized medical coordination.')}</p></header><div data-pakistan-component="results" data-pakistan-result-variant={results?.variant}>{(results?.title||results?.text)&&<header className="pl-results-heading"><h2>{results.title}</h2><p>{results.text}</p></header>}{organ?<OrganHero headingLevel={2} initialOrgan={organ} initialCity={city} forcedCountry="Pakistan" heading={organ+' pledges in '+city} description="Consent, eligibility and clinical coordination remain with authorized services."/>:<CityLandingDonorGrid key={city} mode="organ" country="Pakistan" city={city}/>}</div></section>}
 </div>;
}
