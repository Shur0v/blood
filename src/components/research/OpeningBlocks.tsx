import Link from 'next/link';
import type { ResearchProps } from './types';
const intro=({context:c}:ResearchProps)=><><p className="research-kicker">BloodNet field guide / {c.guide.category}</p><h1>{c.guide.title}</h1><p className="research-lead">{c.guide.lead}</p></>;
export function HeroEditorial(p:ResearchProps){return <header className="research-hero editorial">{intro(p)}<span className="research-edition">An operational guide, written for people.</span></header>;}
export function HeroSplit(p:ResearchProps){return <header className="research-hero research-hero-split"><div>{intro(p)}</div><aside className="research-orbit"><span>BloodNet</span><strong>People.<br/>Care.<br/>Connection.</strong></aside></header>;}
export function HeroMetric(p:ResearchProps){return <header className="research-hero metric-hero"><div>{intro(p)}</div><p className="research-margin-note">Start with a clear question.<br/>Keep the clinical team involved.<br/>Make the next step useful.</p></header>;}
export function HeroDark(p:ResearchProps){return <header className="research-hero ink">{intro(p)}<Link href="#chapters" className="research-button light">Explore the guide ↓</Link></header>;}
export function HeroCentered(p:ResearchProps){return <header className="research-hero centered"><div className="research-seal">B / N</div>{intro(p)}<span className="research-rule"/></header>;}

const links=(p:ResearchProps)=>p.context.guide.chapters.map((chapter,i)=><a key={chapter.title} href={`#chapter-${i+1}`}><span>{String(i+1).padStart(2,'0')}</span>{chapter.title}</a>);
export function TocRail(p:ResearchProps){return <nav aria-label="In this guide" className="research-toc rail">{links(p)}</nav>;}
export function TocTiles(p:ResearchProps){return <nav aria-label="In this guide" className="research-toc tiles">{links(p)}</nav>;}
export function TocPills(p:ResearchProps){return <nav aria-label="In this guide" className="research-toc pills">{links(p)}</nav>;}
export function TocNumbers(p:ResearchProps){return <nav aria-label="In this guide" className="research-toc numbers"><p className="research-kicker">Five useful perspectives</p>{links(p)}</nav>;}
export function TocSidebar(p:ResearchProps){return <nav aria-label="In this guide" className="research-toc sidebar"><h2>Your reading route</h2><div>{links(p)}</div></nav>;}
