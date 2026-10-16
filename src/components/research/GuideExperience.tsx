import Link from 'next/link';
import { DONATION_GUIDES, DONATION_SOURCES, GLOBAL_EVIDENCE, EDITORIAL_REVIEW_DATE, type DonationGuide } from '@/src/lib/donationGuides';
import { getResearchSnapshot } from '@/src/backend/services/donorResearch';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { stringifyJsonLd } from '@/src/lib/aiSeo';
import * as Opening from './OpeningBlocks';
import * as Data from './DataBlocks';
import * as Reading from './ReadingBlocks';
import * as Practice from './PracticeBlocks';
import * as Care from './CareBlocks';
import * as Closing from './ClosingBlocks';
import type { ResearchContext } from './types';

export const RESEARCH_COMPONENT_FAMILIES = [
  [Opening.HeroEditorial,Opening.HeroSplit,Opening.HeroMetric,Opening.HeroDark,Opening.HeroCentered],
  [Opening.TocRail,Opening.TocTiles,Opening.TocPills,Opening.TocNumbers,Opening.TocSidebar],
  [Data.StatTiles,Data.StatRibbon,Data.StatLedger,Data.StatSpotlight,Data.StatComparison],
  [Reading.StoryPanels,Reading.StoryTimeline,Reading.StoryColumns,Reading.StoryNotebook,Reading.StoryAccordion],
  [Practice.ProcessStepper,Practice.ProcessCards,Practice.ProcessChecklist,Practice.ProcessFlow,Practice.ProcessSchedule],
  [Data.CoverageCards,Data.CoverageTable,Data.CoverageBars,Data.CoverageAtlas,Data.CoverageList],
  [Practice.EvidenceNote,Practice.EvidenceCards,Practice.EvidenceTimeline,Practice.EvidenceComparison,Practice.EvidenceLibrary],
  [Care.QuestionsAccordion,Care.QuestionsColumns,Care.QuestionsStack,Care.QuestionsIndex,Care.QuestionsCards],
  [Reading.GlossaryDefinitions,Reading.GlossaryTiles,Reading.GlossaryRail,Reading.GlossaryTable,Reading.GlossaryEditorial],
  [Care.SafetyBanner,Care.SafetyChecklist,Care.SafetyColumns,Care.SafetyAlert,Care.SafetySummary],
  [Closing.ActionSplit,Closing.ActionBand,Closing.ActionCard,Closing.ActionSteps,Closing.ActionCompact],
  [Closing.SourceFootnotes,Closing.SourceBibliography,Closing.SourceCards,Closing.SourceLedger,Closing.SourceEditorial],
];
export function guideComposition(index:number){return RESEARCH_COMPONENT_FAMILIES.map((family,f)=>family[(index*(f%4+1)+Math.floor(index/5)+f)%5]);}
export async function GuideExperience({guide,index,canonicalPath,locationCountry}:{guide:DonationGuide;index:number;canonicalPath?:string;locationCountry?:string}) {
  const originalSnapshot=await getResearchSnapshot();
  const snapshot=locationCountry?{...originalSnapshot,locations:originalSnapshot.locations.filter(row=>row.country===locationCountry)}:originalSnapshot;
  const evidence=guide.category==='Organ donation'?{value:'A voluntary choice',label:'Consent belongs in the care pathway',detail:'WHO’s transplantation principles provide an ethical framework. They do not turn a directory pledge into clinical clearance or replace the law and authorised assessment where a person lives.',source:'transplant' as const}:guide.category==='Privacy & data'&&guide.slug!=='read-donor-data-responsibly'?{value:'Your choice',label:'Public discovery is optional',detail:'The additional public profile requires explicit donor consent. Full phone publication is a separate choice, and neither setting publishes private medical-record files.'}:GLOBAL_EVIDENCE[index%GLOBAL_EVIDENCE.length];
  const context:ResearchContext={guide,snapshot,evidence,sources:[...new Set([...guide.sources,...('source' in evidence&&evidence.source?[evidence.source]:[])])]};
  const blocks=guideComposition(index),path=canonicalPath||`/guides/${guide.slug}`,base=getPublicBaseUrl();
  const words=guide.chapters.reduce((sum,ch)=>sum+ch.text.split(/\s+/).length,0),minutes=Math.max(1,Math.ceil(words/200));
  return <main className="research-page"><div className="research-container">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:stringifyJsonLd([{'@context':'https://schema.org','@type':'Article',headline:guide.title,description:guide.description,url:base+path,author:{'@type':'Organization',name:'BloodNet platform team',url:base+'/about'},datePublished:EDITORIAL_REVIEW_DATE,dateModified:EDITORIAL_REVIEW_DATE,mainEntityOfPage:base+path,articleSection:guide.chapters.map(ch=>ch.title),citation:context.sources.map(id=>DONATION_SOURCES[id].url)}, {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'BloodNet',item:base},{'@type':'ListItem',position:2,name:'Guides',item:base+'/guides'},{'@type':'ListItem',position:3,name:guide.title,item:base+path}]}])}}/>
    <nav className="research-breadcrumb"><Link href="/">BloodNet</Link><span>/</span><Link href="/guides">Guides</Link><span>/</span><span>{guide.category}</span></nav>
    <p className="research-reading-meta">{minutes} min core reading · 5 detailed perspectives · Reviewed <time dateTime={EDITORIAL_REVIEW_DATE}>{EDITORIAL_REVIEW_DATE}</time></p>
    {blocks.map((Block,i)=><Block key={i} context={context}/>)}
    <section className="research-snapshot-notes"><h2>About this platform snapshot</h2><p>Retrieved <time dateTime={snapshot.retrievedAt}>{snapshot.retrievedAt.replace('T',' ').slice(0,19)} UTC</time>. {snapshot.available?'Counts describe participating directory entries. City coverage may overlap; a listing is not a completed donation or a representative survey response.':'Live counts could not be read. This guide remains available without invented substitute totals.'}</p>{snapshot.recordUpdatedAt&&<p>Latest record change represented: {snapshot.recordUpdatedAt.slice(0,10)}. This is not a clinical screening date.</p>}</section>
    <nav className="research-related" aria-label="Related guides"><h2>Keep exploring</h2><div className="research-grid three">{DONATION_GUIDES.filter(item=>item.slug!==guide.slug).sort((a,b)=>Number(b.category===guide.category)-Number(a.category===guide.category)).slice(0,3).map(item=><Link href={`/guides/${item.slug}`} key={item.slug} className="research-surface"><p className="research-kicker">{item.category}</p><h3>{item.title}</h3><span className="research-text-link">Read the guide ↗</span></Link>)}</div></nav>
  </div></main>;
}
